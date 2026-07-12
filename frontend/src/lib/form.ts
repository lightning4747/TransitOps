import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodType } from 'zod';
import type { Resolver, FieldValues } from 'react-hook-form';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function zr<T extends FieldValues>(schema: ZodType<T>): Resolver<T, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return zodResolver(schema as any) as unknown as Resolver<T, any>;
}

