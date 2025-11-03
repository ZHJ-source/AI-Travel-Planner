import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
}

