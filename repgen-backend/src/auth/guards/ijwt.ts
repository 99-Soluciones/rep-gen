import { Request } from 'express';
export interface JwtPayload {
  id: number;
  role: string;
  user: string;
  tenant: string;
}
export interface AuthenticatedRequest extends Request {
  id: JwtPayload['id'];
  user: JwtPayload['user'];
  role: JwtPayload['role'];
  tenant: JwtPayload['tenant'];
}
