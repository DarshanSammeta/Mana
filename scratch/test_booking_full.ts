import { PrismaClient } from '@prisma/client';
import { pricingService } from '../src/services/server/pricing.service';
import { AuditService } from '../src/services/server/audit.service';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function run() {
  console.log('--- TESTING BOOKING PERFORMANCE & ATOMICITY (FULL TRACE) ---');

  try {
    // 1. Setup Test Data
    const user = await prisma.user.findFirst({ where: { role: 'CUSTOMER' }, select: { id: true, fullName: true, role: true } });
    if (!user) throw new Error("No customer found for test");
    const profile = await prisma.customerprofile.findFirst({ where: { userId: user.id } });
    const pkg = await prisma.renamedpackage.findFirst({
        include: {
            service: {
                include: {
                    vendorprofile: true,
                    servicetype: {
                        include: {
                            subcategory: {
                                include: {
                                    category: {
                                        include: {
                                            eventtype: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!user || !profile || !pkg) {
      console.error('Missing test data.');
      return;
    }

    const payload = {
        vendorId: pkg.service.vendorProfileId,
        eventTypeId: pkg.service.servicetype.subcategory.category.eventTypeId,
        categoryId: pkg.service.servicetype.subcategory.categoryId,
        subcategoryId: pkg.service.servicetype.subcategoryId,
        serviceTypeId: pkg.service.serviceTypeId,
        packageId: pkg.id,
        guestCount: 100,
        selectedAddonIds: []
    };

    console.log('--- STARTING PERFORMANCE TRACE ---');
    const startTime = performance.now();

    // STEP 1: Parallel Lookups
    const t1Start = performance.now();
    const [p, v, count] = await Promise.all([
        prisma.customerprofile.findUnique({ where: { userId: user.id } }),
        pricingService.validateHierarchy(payload),
        prisma.booking.count({ where: { createdAt: { gte: new Date('2026-01-01') } } })
    ]);
    const t1End = performance.now();
    console.log(`Step 1 (Parallel Lookups) took: ${(t1End - t1Start).toFixed(2)}ms`);

    // STEP 2: Pricing
    const t2Start = performance.now();
    const pricing = await pricingService.calculateBookingPrice({
        packageId: payload.packageId,
        guestCount: payload.guestCount,
        addonIds: payload.selectedAddonIds
    }, undefined, v.pkg);
    const t2End = performance.now();
    console.log(`Step 2 (Pricing - no DB) took: ${(t2End - t2Start).toFixed(2)}ms`);

    // STEP 3: Transaction
    const t3Start = performance.now();
    const result = await prisma.$transaction(async (tx) => {
        const b = await tx.booking.create({
            data: {
                bookingNumber: 'TEST-' + Date.now(),
                customerProfileId: profile.id,
                vendorId: payload.vendorId,
                eventTypeId: payload.eventTypeId,
                categoryId: payload.categoryId,
                subcategoryId: payload.subcategoryId,
                serviceTypeId: payload.serviceTypeId,
                packageId: payload.packageId,
                eventDate: new Date(),
                eventTime: '12:00',
                eventLocation: 'Test',
                city: 'Test',
                state: 'Test',
                pincode: '000000',
                guestCount: 100,
                eventName: 'Test',
                subTotal: pricing.subtotal,
                taxAmount: pricing.taxes,
                totalAmount: pricing.total,
                advanceAmount: pricing.advanceAmount,
                balanceAmount: pricing.balanceAmount,
                paymentStage: 'PENDING',
                status: 'PENDING_VENDOR_RESPONSE',
                snapshot: {}
            }
        });

        await AuditService.logBooking(
            b.id,
            "TEST_PERFORMANCE",
            { id: user.id, role: user.role, name: user.fullName },
            { new: { total: pricing.total } },
            undefined,
            tx
        );
        return b;
    });
    const t3End = performance.now();
    console.log(`Step 3 (Transaction + Audit) took: ${(t3End - t3Start).toFixed(2)}ms`);

    const totalTime = performance.now() - startTime;
    console.log(`TOTAL EXECUTION TIME: ${totalTime.toFixed(2)}ms`);

    // CLEANUP
    await prisma.audit_log.deleteMany({ where: { bookingId: result.id } });
    await prisma.booking.delete({ where: { id: result.id } });

  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
