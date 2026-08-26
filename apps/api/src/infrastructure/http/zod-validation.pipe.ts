import type { PipeTransform } from '@nestjs/common';
import { ErrorCode } from '@roadtalk/contracts';
import type { ZodType } from 'zod';

import { AppException } from '../errors/app-exception';

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new AppException(ErrorCode.VALIDATION_ERROR, undefined, result.error.flatten());
    }

    return result.data;
  }
}
