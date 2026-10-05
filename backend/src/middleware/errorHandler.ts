import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[API Error]:', err.message);
  const statusCode = err.message.includes('not found') ? 404 : 400;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error'
  });
};
