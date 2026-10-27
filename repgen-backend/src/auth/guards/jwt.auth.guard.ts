import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import type { AuthenticatedRequest, JwtPayload } from './ijwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JWT_COOKIE_NAME } from '../auth.constants';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  /**
   * Función principal del guardia que se ejecuta en cada solicitud protegida. Verifica si la ruta es pública,
   * extrae y valida el token JWT, y adjunta la información del usuario al objeto de solicitud.
   * @param context
   * @returns true si la autenticación es exitosa o la ruta es pública, de lo contrario lanza una excepción de no autorizado.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      //SE VERIFICA EL TOKEN
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.id = payload.id;
      request.user = payload.user;
      request.role = payload.role;
      request.tenant = payload.tenant;
    } catch {
      throw new UnauthorizedException('Token inválido');
    }

    return true;
  }
  /**
   * Extrae el token de la cookie httpOnly (mecanismo actual). Si no está
   * presente, cae al encabezado "Authorization: Bearer <token>" para no
   * romper clientes que aún no migraron a cookies.
   *
   * @param request
   * @returns token o undefined si no se encuentra en ninguna de las dos fuentes
   */
  private extractTokenFromHeader(request: Request): string | undefined {
    const cookieToken = (
      request.cookies as Record<string, string> | undefined
    )?.[JWT_COOKIE_NAME];
    if (cookieToken) return cookieToken;

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
