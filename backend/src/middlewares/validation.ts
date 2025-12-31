import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodObject } from 'zod';

export const validate =
  (schema: ZodObject) => (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        console.error('validation error');
        console.error(err);

        return res.status(400).json({
          message: 'Validation error',
          errors: err.errors,
        });
      }
      next(err);
    }
  };
