import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FileMakerService } from '../filemaker/filemaker.service';
import { ConfigService } from '@nestjs/config';
import type { ValidateTokenResult } from './iauth';
import { FileMakerCondition } from '../filemaker/ifilemaker';
import { apiAuthFieldMapJson } from './auth-field-map';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class AuthService {
  private readonly master_key: string;
  constructor(
    private jwtService: JwtService,
    private fileMakerService: FileMakerService,
    private logger: LoggerService,
    private configService: ConfigService,
  ) {
    this.master_key = this.configService.get<string>('MASTER_KEY') ?? '';
  }
  /**
   * De momento, simula la validación de un token proporcionado por FileMaker. En una implementación real,
   * esta función debería consultar a FileMaker para verificar la validez del token y obtener la información del usuario asociada.
   * Si el token es válido, se genera un nuevo JWT con la información del usuario y se devuelve junto con los detalles del usuario.
   * @param token El token proporcionado por FileMaker que se desea validar.
   * @returns Payload del JWT generado y la información del usuario si el token es válido, de lo contrario lanza una excepción de no autorizado.
   */
  async validateTokenFileMaker(
    token: string,
    dbName: string,
  ): Promise<ValidateTokenResult> {
    try {
      if (token === this.master_key) {
        const payload = {
          id: 2,
          name: 'Developer',
          role: 'api_user',
          tenant: dbName,
        };
        const accessToken = await this.jwtService.signAsync(payload);
        return { accessToken, user: payload };
      }

      if (!this.validateToken(token)) {
        throw new UnauthorizedException('Formato de token inválido');
      }
      const query: FileMakerCondition[] = [
        {
          [apiAuthFieldMapJson.data.token]: `${token}`,
        },
      ];
      const getTokenInfo = await this.fileMakerService.findRecords(
        dbName,
        'api_auth',
        query,
        1,
        1,
      );

      if (
        !getTokenInfo?.response?.data ||
        getTokenInfo.response.data.length === 0
      ) {
        throw new UnauthorizedException(
          'Token no válido o no encontrado en FileMaker',
        );
      }

      const timeStampExp = getTokenInfo.response.data[0].fieldData[
        apiAuthFieldMapJson.data.fecha_expiration
      ] as string | number;

      let realTime = Number(timeStampExp);

      if (isNaN(realTime)) {
        realTime = new Date(timeStampExp).getTime();
      }

      if (isNaN(realTime)) {
        throw new UnauthorizedException(
          'El formato de expiración del token es inválido',
        );
      }

      const recordID = getTokenInfo.response.data[0].recordId;

      if (realTime < new Date().getTime()) {
        try {
          await this.fileMakerService.deleteRecord(
            dbName,
            'api_auth',
            recordID,
          );
        } catch (delError) {
          this.logger.error(
            'No se pudo borrar el registro del token expirado en FileMaker',
            delError as Error,
            { tenant: dbName, recordId: recordID },
          );
        }
        throw new UnauthorizedException('Token expirado');
      }

      const userName = getTokenInfo.response.data[0].fieldData[
        apiAuthFieldMapJson.data.nombre_usuario
      ] as string;
      const userID = Number(
        getTokenInfo.response.data[0].fieldData[
          apiAuthFieldMapJson.data.id_usuario
        ],
      );

      const payload = {
        id: userID,
        name: userName,
        role: 'api_user',
        tenant: dbName,
      };

      const accessToken = await this.jwtService.signAsync(payload);

      try {
        await this.fileMakerService.deleteRecord(dbName, 'api_auth', recordID);
      } catch (delError) {
        this.logger.error(
          'Error al eliminar el token validado en FileMaker',
          delError as Error,
          {
            tenant: dbName,
            recordId: recordID,
          },
        );
      }

      return {
        accessToken,
        user: payload,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.logger.warn('Token inválido o expirado en FileMaker', {
          tenant: dbName,
          reason: error.message,
        });
        throw error;
      }
      this.logger.error('Error al validar token en FileMaker', error as Error, {
        tenant: dbName,
      });
      throw new UnauthorizedException('No se pudo validar la autenticación');
    }
  }

  private validateToken(token: string): boolean {
    if (token.length !== 36) return false;
    const regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(token);
  }
}
