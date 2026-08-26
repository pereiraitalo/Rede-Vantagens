/**
 * Recursively strips any property with an `undefined` value from an object or array.
 * Firestore strictly forbids `undefined` in document fields and will throw:
 * "Function addDoc() called with invalid data. Unsupported field value: undefined..."
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object') {
    // Keep Dates, Timestamps, and FieldValues untouched
    if (
      data instanceof Date ||
      (data as any).toMillis !== undefined ||
      (data as any)._methodName !== undefined ||
      (data as any).constructor?.name === 'FieldValue'
    ) {
      return data;
    }

    const cleanObj: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleanObj[key] = sanitizeForFirestore(value);
      }
    }
    return cleanObj as any;
  }
  return data;
}
