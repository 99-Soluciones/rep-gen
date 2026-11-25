import { Request } from 'express';
export interface JwtPayload {
  id: number;
  role: string;
  /** Nombre del usuario: así lo firma AuthService. */
  name: string;
  tenant: string;
}
export interface AuthenticatedRequest extends Request {
  id: JwtPayload['id'];
  user: JwtPayload['name'];
  role: JwtPayload['role'];
  tenant: JwtPayload['tenant'];
}
