import type { Request, Response, NextFunction } from 'express';

/**
 * Toy bearer-token authentication middleware.
 * In a real app this would validate a JWT or call an introspection endpoint.
 */
export function bearerAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or invalid Authorization header' });
    return;
  }
  // Attach a fake user to the request for downstream handlers.
  (req as Request & { user: { id: string } }).user = { id: 'user-1' };
  next();
}
