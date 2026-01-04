import { NextFunction, Request, Response } from 'express';
import { ZodObject, ZodError } from 'zod';
import { AppError } from '../utils/errors';

export const validate =
  (schema: ZodObject<any>) => (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Assign parsed data back to request to ensure downstream handlers use validated data
      req.body = result.body;
      req.query = result.query as any;
      req.params = result.params as any;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = `Validation failed: ${err.issues.map((issue) => issue.message).join(', ')}`;
        return next(new AppError(400, message));
      }
      next(err);
    }
  };
