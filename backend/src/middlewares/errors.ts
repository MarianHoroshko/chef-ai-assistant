import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 Error:', err);
  }

  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Something went wrong';

  res.status(statusCode).json({
    status: err instanceof AppError && err.statusCode < 500 ? 'fail' : 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, details: err }),
  });
};
