import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import type { ValidateTokenResult } from './iauth';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler/dist/throttler.decorator';
import { JWT_COOKIE_NAME } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  /**
   * Guarda el JWT en una cookie HttpOnly en vez de exponerlo en el cuerpo de
   * la respuesta, para que JavaScript en el cliente no pueda leerlo (mitiga
   * robo de token vía XSS). `sameSite: 'lax'` es suficiente porque el
   * frontend siempre llama a la API a través de un proxy same-origin (rewrite
   * de Vercel en producción, proxy de Vite en desarrollo).
   */
  private setAuthCookie(response: Response, accessToken: string) {
    const expiresInSeconds = parseInt(
      this.configService.get<string>('JWT_EXPIRES_IN', '3600'),
      10,
    );
    response.cookie(JWT_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: expiresInSeconds * 1000,
      path: '/',
    });
  }

  /**
   * Endpoint para validar un token de FileMaker. Este endpoint es público y no requiere autenticación JWT,
   * lo que permite a los clientes validar sus tokens directamente con el servicio de autenticación.
   * @param token Token generado desde FileMaker que se desea validar.
   * @returns Información del usuario si el token es válido (el JWT viaja en una cookie httpOnly), o un mensaje de error si el token no es proporcionado.
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login-token')
  @Public()
  async loginWithTokenFileMaker(
    @Body('token') token: string,
    @Body('tenant') tenant: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: ValidateTokenResult['user'] } | { message: string }> {
    if (!token) {
      return {
        message: 'Token es requerido',
      };
    }

    if (!tenant) {
      return {
        message: 'Tenant es requerido',
      };
    }

    const result: ValidateTokenResult =
      await this.authService.validateTokenFileMaker(token, tenant);
    this.setAuthCookie(response, result.accessToken);
    return { user: result.user };
  }

  /**
   * Confirma si la cookie de sesión actual sigue siendo válida. No hace falta
   * leer nada del request: si la cookie falta o expiró, el JwtAuthGuard
   * global ya responde 401 antes de llegar aquí.
   */
  @HttpCode(HttpStatus.OK)
  @Get('me')
  me(): { ok: true } {
    return { ok: true };
  }

  /**
   * Limpia la cookie de sesión. Público porque debe poder llamarse aunque la
   * cookie ya haya expirado o no exista.
   */
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @Public()
  logout(@Res({ passthrough: true }) response: Response): { message: string } {
    response.clearCookie(JWT_COOKIE_NAME, { path: '/' });
    return { message: 'Sesión cerrada' };
  }
}
