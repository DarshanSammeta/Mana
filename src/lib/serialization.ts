/**
 * Robust serialization utility for Prisma objects to ensure they can be passed
 * from Server Components to Client Components in Next.js.
 *
 * Converts:
 * - Decimal -> number
 * - BigInt -> string
 * - Date -> string (ISO)
 */

export function serializePrisma(data: unknown): any {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle BigInt (Primitive, must be checked before objects)
  if (typeof data === 'bigint') {
    return data.toString();
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializePrisma(item));
  }

  // Handle Date
  if (data instanceof Date) {
    return data.toISOString();
  }

  // Handle objects
  if (typeof data === 'object') {
    // Check for Prisma.Decimal structural match
    // Prisma Decimals typically have 'd', 'e', 's' properties and a constructor named 'Decimal'
    const obj = data as Record<string, unknown>;

    if (
      obj.constructor?.name === 'Decimal' ||
      ('d' in obj && 's' in obj && 'e' in obj)
    ) {
      return Number(obj.toString());
    }

    // Recursively handle plain objects
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializePrisma(value);
    }
    return serialized;
  }

  return data;
}
