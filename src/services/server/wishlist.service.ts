import "server-only";
import { getPrisma } from "@/lib/prisma";

if (typeof window !== "undefined") {
  throw new Error("wishlist.service can only be used on the server.");
}

export class WishlistService {
  private static async getProfileId(userId: string) {
    const prisma = getPrisma();
    const profile = await prisma.customerprofile.findUnique({
      where: { userId },
      select: { id: true }
    });
    if (!profile) throw new Error("Customer profile not found");
    return profile.id;
  }

  static async getWishlist(userId: string) {
    const prisma = getPrisma();
    const profileId = await this.getProfileId(userId);

    let wishlist = await prisma.wishlist.findUnique({
      where: { customerProfileId: profileId },
      include: {
        wishlistitem: true,
      },
    });

    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { customerProfileId: profileId, updatedAt: new Date() },
        include: { wishlistitem: true },
      });
    }

    return wishlist;
  }

  static async toggleItem(userId: string, type: "VENDOR" | "SERVICE", targetId: string) {
    const prisma = getPrisma();
    const wishlist = await this.getWishlist(userId);

    const existing = await prisma.wishlistitem.findUnique({
      where: {
        wishlistId_targetId_type: {
          wishlistId: wishlist.id,
          targetId,
          type,
        },
      },
    });

    if (existing) {
      await prisma.wishlistitem.delete({ where: { id: existing.id } });
      return { status: "removed" };
    } else {
      await prisma.wishlistitem.create({
        data: {
          wishlistId: wishlist.id,
          targetId,
          type,
        },
      });
      return { status: "added" };
    }
  }

  static async moveToCart(userId: string, wishlistId: string, targetId: string, type: string) {
    const prisma = getPrisma();
    const profileId = await this.getProfileId(userId);

    return await prisma.$transaction(async (tx) => {
      // 1. Check item exists
      const item = await tx.wishlistitem.findFirst({
        where: { wishlistId, targetId, type }
      });

      if (!item) throw new Error("Item not in wishlist");

      // 2. Add to Cart
      const cart = await tx.cart.upsert({
        where: { customerProfileId: profileId },
        create: { customerProfileId: profileId, updatedAt: new Date() },
        update: { updatedAt: new Date() }
      });

      await tx.cartitem.upsert({
        where: {
          cartId_targetId_type: {
            cartId: cart.id,
            targetId,
            type
          }
        },
        create: {
          cartId: cart.id,
          targetId,
          type,
          quantity: 1,
          updatedAt: new Date()
        },
        update: { updatedAt: new Date() }
      });

      // 3. Remove from wishlist
      await tx.wishlistitem.delete({ where: { id: item.id } });

      return { success: true };
    });
  }

  static async bulkRemove(userId: string, itemIds: string[]) {
    const prisma = getPrisma();
    const wishlist = await this.getWishlist(userId);
    return await prisma.wishlistitem.deleteMany({
      where: {
        wishlistId: wishlist.id,
        id: { in: itemIds }
      }
    });
  }
}
