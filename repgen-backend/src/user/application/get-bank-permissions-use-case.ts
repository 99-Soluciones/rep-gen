import { Injectable } from '@nestjs/common';
// import { CACHE_MANAGER } from '@nestjs/cache-manager'; // <--- Usar esto en un futuro
// import { Cache } from 'cache-manager';
import { FileMakerService } from '../../filemaker/filemaker.service';
import type {
  FindRecordsResult,
  FileMakerCondition,
} from '../../filemaker/ifilemaker';

import { userBankPermissionFieldMapJson } from '../infrastructure/user-bank-permission-field-map';
import { BankPermission } from '../domain';
import { LoggerService } from '../../common/logger';
@Injectable()
export class GetBankPermissionsUseCase {
  private banksUserHasAccess: Map<string, BankPermission> = new Map();
  private totalBanksByTenent: Map<string, number> = new Map();
  constructor(
    private readonly fmService: FileMakerService,
    private readonly logger: LoggerService,
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
    const cacheKey = `${dbName}-${user}`;

    const cachedPermissions = this.banksUserHasAccess.get(cacheKey);
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
        //Por cuestion de tiempo, se dejara para despues, pero la idea es obtener el total de bancos para cada tenant y guardarlo en cache, esto con la finalidad de validar que si el usuario tiene acceso a todos los bancos o no, y asi evitar hacer consultas innecesarias a filemaker
        //const portalData = permissions.response.data[0].portalData?.['Bancos'];
        //const totalBanks = this.getTotalBanksByTenant(portalData as [], dbName);
      }

      this.banksUserHasAccess.set(cacheKey, newPermission);

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

  private getTotalBanksByTenant(portalData: [], dbName: string): number {
    const cacheKey = `total-banks-${dbName}`;
    let total = 0;
    const cachedTotal = this.totalBanksByTenent.get(cacheKey);
    if (cachedTotal !== undefined) {
      return cachedTotal;
    }

    portalData.forEach((bank) => {
      if (bank['_isCarpetaCuenta|v0.17.0'] === 'Cuenta') {
        total++;
      }
    });

    this.totalBanksByTenent.set(cacheKey, total);
    return total;
  }
}
