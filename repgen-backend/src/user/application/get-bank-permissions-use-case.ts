import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from '@nestjs/cache-manager';
import { FileMakerService } from '../../filemaker/filemaker.service';
import type {
  FindRecordsResult,
  FileMakerCondition,
} from '../../filemaker/ifilemaker';

import { userBankPermissionFieldMapJson } from '../infrastructure/user-bank-permission-field-map';
import { BankPermission } from '../domain';
import { LoggerService } from '../../common/logger';

// Con TTL para que un permiso revocado en FileMaker deje de aplicar sin reiniciar.
const PERMISSIONS_CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class GetBankPermissionsUseCase {
  constructor(
    private readonly fmService: FileMakerService,
    private readonly logger: LoggerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}
  async execute(dbName: string, user: number): Promise<FindRecordsResult> {
    const query: FileMakerCondition[] = [
      {
        [userBankPermissionFieldMapJson.data.id_user]: `${user}`,
      },
    ];
    return this.fmService.findRecords(
      dbName,
      'api_permisoBancos',
      query,
      1,
      9999,
    );
  }

  async getBankPermissions(
    dbName: string,
    user: number,
  ): Promise<BankPermission> {
    const cacheKey = `bank-permissions:${dbName}-${user}`;

    const cachedPermissions =
      await this.cacheManager.get<BankPermission>(cacheKey);
    if (cachedPermissions) {
      this.logger.log(
        `Permisos de bancos obtenidos de cache para el usuario ${user} en la base de datos ${dbName}. Cantidad: ${cachedPermissions.banksNames.length}`,
      );
      return cachedPermissions;
    }
    try {
      const permissions = await this.execute(dbName, user);
      const newPermission: BankPermission = {
        banksNames: [],
        idUser: user,
      };
      if (permissions.response.data && permissions.response.data.length > 0) {
        permissions.response.data.forEach((bank) => {
          const bankName =
            bank.fieldData[userBankPermissionFieldMapJson.data.nombreBanco];
          if (bankName) {
            newPermission.banksNames.push(bankName as string);
          }
        });
      }

      await this.cacheManager.set(
        cacheKey,
        newPermission,
        PERMISSIONS_CACHE_TTL_MS,
      );

      return newPermission;
    } catch (error) {
      this.logger.error(
        'Error al obtener permisos de bancos del usuario',
        error as Error,
        { tenant: dbName, userId: user },
      );
      throw error;
    }
  }
}
