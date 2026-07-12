// Typed wrapper for zodResolver to satisfy strict TS6 generics
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import type { Resolver } from 'react-hook-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zr<T>(schema: ZodType<T>): Resolver<T, any, T> {
  return zodResolver(schema) as Resolver<T, any, T>;
}
