import { FileMakerCondition } from '../../../filemaker/ifilemaker';
import { GetBankPermissionsUseCase } from '../../../user/application';

export async function getBankBaseFilters(
  permissionsUseCase: GetBankPermissionsUseCase, // Inyectamos el useCase, NO el fileMakerService
  dbName: string,
  user: number,
  bankFieldName: string = 'Nombre_Banco', // TODO: Pon aquí el nombre exacto de la columna en FM
): Promise<FileMakerCondition[]> {
  const permissions = await permissionsUseCase.getBankPermissions(dbName, user);
  if (!permissions || permissions.banksNames.length === 0) {
    return [{ [bankFieldName]: '===SIN_ACCESO===' }];
  }

  const baseConditions: FileMakerCondition[] = permissions.banksNames.map(
    (bank) => {
      return {
        [bankFieldName]: `==${bank}`,
      };
    },
  );
  //Temporal, debo validar con Eric que usuarios tiene accesos a movivmientos no bancarizados,
  baseConditions.push({
    ['_id_banco']: 0,
  });

  return baseConditions;
}
