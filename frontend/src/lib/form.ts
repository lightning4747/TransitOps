import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import type { Resolver, FieldValues } from 'react-hook-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zr<T extends FieldValues>(schema: ZodType<T>): Resolver<T, any> {
  return zodResolver(schema) as unknown as Resolver<T, any>;
}

