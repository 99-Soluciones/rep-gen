#!/usr/bin/env node
// @ts-check

import fs from 'node:fs';
import path from 'node:path';

/**
 * @typedef {{ report: string; force: boolean }} ParsedArgs
 */

/**
 * @typedef {'skipped' | 'created' | 'updated'} WriteStatus
 */

/**
 * @typedef {{ filePath: string; status: WriteStatus }} WriteResult
 */

/** @param {string} value */
function toCamelCase(value) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');

  const parts = normalized.split('-').filter(Boolean);
  if (parts.length === 0) {
    return '';
  }

  return parts
    .map((part, index) =>
      index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join('');
}

/** @param {string} value */
function toKebabCase(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** @param {string} value */
function toPascalCase(value) {
  const camel = toCamelCase(value);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/** @param {string[]} argv
 *  @returns {ParsedArgs}
 */
function parseArgs(argv) {
  /** @type {ParsedArgs} */
  const args = { report: '', force: false };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === '--force') {
      args.force = true;
      continue;
    }

    if (token === '--report') {
      args.report = argv[i + 1] || '';
      i += 1;
      continue;
    }

    if (token.startsWith('--report=')) {
      args.report = token.slice('--report='.length);
    }
  }

  return args;
}

/**
 * @param {string} filePath
 * @param {string} content
 * @param {boolean} force
 * @returns {WriteResult}
 */
function writeIfNeeded(filePath, content, force) {
  if (fs.existsSync(filePath) && !force) {
    return { filePath, status: 'skipped' };
  }

  const existedBefore = fs.existsSync(filePath);
  fs.writeFileSync(filePath, content, 'utf8');
  return {
    filePath,
    status: existedBefore && force ? 'updated' : 'created',
  };
}

/**
 * @param {string} reportCamel
 * @returns {string} */
function getFieldMapTemplate(reportCamel) {
  return `/**
 * Diccionario tipado de mapeo de campos para el reporte ${reportCamel}.
 * Define las rutas de los campos en FileMaker que se usarán en el mapeo.
 * Usa 'as const' para mantener los tipos literales exactos.
 */
export const ${reportCamel}FieldMapJson = {
  data: {
    valor1: 'valor1_',
    valor2: 'valor2_',
    valor3: 'valor3_',
    
    portal: {
      portal1: 'portal1_',
    },
  },
} as const;
`;
}

/**
 * @param {string} reportPascal
 * @param {string} reportKebab
 * @param {string} reportCamel
 * @returns {string}
 */
function getHelperTemplate(reportPascal, reportKebab, reportCamel) {
  return `import { RawRecord } from '../../domain/reports.types';
import type { ${reportPascal}MappedRecord } from '../../domain/${reportKebab}';
import { ${reportCamel}FieldMapJson } from './${reportKebab}-field-map';
import {
  FieldMapHelper,
  PortalSourceByKey,
} from '../shared/reports-mapping-helpers';

const fieldMapHelper = new FieldMapHelper(${reportCamel}FieldMapJson);

// Define aqui que keys del map viven en portalData y en que portal buscar.
const ${reportPascal}_PORTAL_SOURCE_BY_KEY = {
  // ejemplo: cliente: 'Cliente',
} as const satisfies PortalSourceByKey;

/**
 * Convierte un registro raw (fieldData + portalData) a llaves limpias
 * definidas en ${reportKebab}-field-map.ts.
 * @param record Registro raw de FileMaker.
 * @returns Registro normalizado con keys limpias.
 * @example
 * const clean = map${reportPascal}RecordWithCleanKeys(record);
 * // clean.valor1
 */
export function map${reportPascal}RecordWithCleanKeys(
  record: RawRecord,
): ${reportPascal}MappedRecord {
  return fieldMapHelper.mapRecordWithPortalConfig<${reportPascal}MappedRecord>(
    record,
    ${reportPascal}_PORTAL_SOURCE_BY_KEY,
  );
}

/**
 * Convierte multiples registros raw a llaves limpias.
 * @param records Lista de registros raw.
 * @returns Lista mapeada con keys limpias.
 * @example
 * const list = map${reportPascal}RecordsWithCleanKeys(rawRecords);
 */
export function map${reportPascal}RecordsWithCleanKeys(
  records: RawRecord[],
): ${reportPascal}MappedRecord[] {
  return records.map(map${reportPascal}RecordWithCleanKeys);
}

/**
 * Resuelve ruta limpia a campo raw.
 * @param cleanPath Ruta de key limpia (ej. valor1).
 * @returns Nombre de campo raw o null.
 */
export function get${reportPascal}RawFieldName(cleanPath: string): string | null {
  return fieldMapHelper.getRawFieldName(cleanPath);
}`;
}

/**
 * @param {string} reportPascal
 * @param {string} reportKebab
 * @param {string} reportCamel
 * @returns {string}
 */
function getUseCaseTemplate(reportPascal, reportKebab, reportCamel) {
  return `import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import type { Filter${reportPascal}Model, Report${reportPascal}Record } from '../../domain/${reportKebab}';

import { BaseReportService } from '../shared/base-report.service';
import { FileMakerService } from '../../../filemaker/filemaker.service';

import { cleanData, ${reportCamel}FieldMapJson } from '../../infrastructure/${reportKebab}';
import { get${reportPascal}BaseFilters } from '../../infrastructure/${reportKebab}/${reportKebab}.permissions.filter';
import { GetBankPermissionsUseCase } from '../../../user/application';
import { LoggerService } from '../../../common/logger';

@Injectable()
export class Get${reportPascal}ReportUseCase extends BaseReportService<
  Filter${reportPascal}Model,
  Report${reportPascal}Record,
  GetBankPermissionsUseCase
> {
  constructor(
    fmService: FileMakerService,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    permissionsUseCase: GetBankPermissionsUseCase,
    logger: LoggerService,
  ) {
    super(
      fmService,
      cacheManager,
      permissionsUseCase,
      {
        layoutName: 'nombre_layout_en_filemaker',
        cachePrefix: '${reportPascal}Report',
        dateField: [${reportCamel}FieldMapJson.data.valor3],
        permissionFieldName: [${reportCamel}FieldMapJson.data.valor1],
        fieldMapping: {
          valor1: ${reportCamel}FieldMapJson.data.valor1,
          valor2: ${reportCamel}FieldMapJson.data.valor2,
          valor3: ${reportCamel}FieldMapJson.data.valor3,
        },
        globalSearchFields: [
          ${reportCamel}FieldMapJson.data.valor1,
          ${reportCamel}FieldMapJson.data.valor2,
          ${reportCamel}FieldMapJson.data.valor3,
        ],
        cleanDataFunction: cleanData,
        permissionFiltersFunction: get${reportPascal}BaseFilters,
      },
      logger,
    );
  }
}
`;
}

/**
 * @param {string} reportPascal
 * @returns {string}
 */
function getPermissionsFilterTemplate(reportPascal) {
  return `import { FileMakerCondition } from '../../../filemaker/ifilemaker';
import { GetBankPermissionsUseCase } from '../../../user/application';

export async function get${reportPascal}BaseFilters(
  permissionsUseCase: GetBankPermissionsUseCase,
  dbName: string,
  user: number,
  permissionFieldName: string = 'Nombre_Banco',
): Promise<FileMakerCondition[]> {
  const permissions = await permissionsUseCase.getBankPermissions(dbName, user);
  if (!permissions || permissions.banksNames.length === 0) {
    return [{ [permissionFieldName]: '===SIN_ACCESO===' }];
  }

  const baseConditions: FileMakerCondition[] = permissions.banksNames.map(
    (bank) => ({
        [permissionFieldName]: '==' + bank,
    }),
  );

  return baseConditions;
}
`;
}

/**
 * @param {string} reportPascal
 * @param {string} reportKebab
 * @returns {string}
 */
function getMappingConfigTemplate(reportPascal, reportKebab) {
  return `import Ajv2020 from 'ajv/dist/2020';
import { BadRequestException } from '@nestjs/common';
import type { RawRecord } from '../../domain/reports.types';
import type { Report${reportPascal}Record, ${reportPascal}MappedRecord } from '../../domain/${reportKebab}';
import schema from './${reportKebab}-report.schema.json';

import { getPortalRows, TypeGetters } from '../../../common/utils';
import { map${reportPascal}RecordWithCleanKeys } from './${reportKebab}-field-map.helper';

const { getString, getNumber } = TypeGetters;

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate${reportPascal}Record = ajv.compile(schema);

const BASE_${reportPascal}_DEFAULTS: Report${reportPascal}Record = {
  valor1: 0,
  valor2: '',
  valor3: 0,
};

function assert${reportPascal}Record(record: RawRecord, index: number): void {
  if (validate${reportPascal}Record(record)) {
    return;
  }
  const details = ajv.errorsText(validate${reportPascal}Record.errors, {
    separator: '; ',
    dataVar: \`rawData[\${index}]\`,
  });

  throw new BadRequestException(\`${reportPascal} record invalido: \${details}\`);
}

/**
 * Limpia y transforma los datos crudos de FileMaker en un formato adecuado para el reporte de ventas.
 * @param rawData Un array de registros crudos obtenidos de FileMaker, cada uno con su estructura de campos y portales.
 * @returns Un array de registros limpios y transformados para el reporte de ventas.
 */
export function cleanData(rawData: RawRecord[]): Report${reportPascal}Record[] {
  const cleanedData = rawData.flatMap((record: RawRecord, index: number) => {
    assert${reportPascal}Record(record, index);

    const fields = record.fieldData;
    const mappedRecord: ${reportPascal}MappedRecord = map${reportPascal}RecordWithCleanKeys(record);

    const cleanedRecord: Report${reportPascal}Record = {
      ...BASE_${reportPascal}_DEFAULTS,
      valor1: getNumber(mappedRecord.valor1),
      valor2: getString(mappedRecord.valor2),
      valor3: getNumber(mappedRecord.valor3),
    };

    const PortalMap = mappedRecord.portal;

    if (PortalMap && Object.keys(PortalMap).length > 0) {
      // Ejemplo de mapeo de datos desde portales, ajusta segun tu estructura y necesidades.
    }

    return cleanedRecord;
  });

  return cleanedData;
}

  `;
}

/**
 * @param {String} reportPascal
 * @returns {String}
 */
function getInterfaceTemplate(reportPascal) {
  return `import type { FilterModel } from '../reports.types';
/**
 * Primeras dos interfaces para la salida del reporte de bancos, con campos opcionales para facilitar la limpieza y transformación de datos.
 */
export interface Report${reportPascal}Record {
  valor1: number;
  valor2: string;
  valor3: number;
}

export interface Filter${reportPascal}Model {
  valor1?: FilterModel;
  valor2?: FilterModel;
  valor3?: FilterModel;
}

/**
 * Interfaz de ejemplo para un registro mapeado con keys limpias, incluyendo campos anidados y portales.
 * Ajusta esta interfaz según la estructura de tu reporte y los datos que necesites manejar.
 */

export interface ${reportPascal}PersonaMappedRecord {
  portal1: string;
  portal2: string;
}

export interface ${reportPascal}MappedRecord {
  valor1: string;
  valor2: string;
  valor3: string;
  portal: {
    portalFields: ${reportPascal}MappedRecord;
  };
}

`;
}

/**
 * @returns {String}
 */
function getSchemaTemplate() {
  return `{
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "type": "object",
    "properties": {
        "fieldData": {
            "type": "object",
            "properties": {
                "valor1": {
                    "type": "number"
                },
                "valor2": {
                    "type": "string"
                },
                "valor3": {
                    "type": "number"
                }
            },
            "required": [
                "valor1",
                "valor2",
                "valor3"
            ],
            "additionalProperties": true
        },
        "portalData": {
            "type": "object",
            "properties": {
                "Portal1": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "additionalProperties": true
                    }
                },
            },
            "additionalProperties": true
        }
    },
    "required": ["fieldData", "portalData"],
    "additionalProperties": true
}`;
}

function main() {
  const { report, force } = parseArgs(process.argv.slice(2));

  if (!report) {
    console.error(
      'Uso: npm run generate:field-map -- --report <nombreReporte> [--force]',
    );
    process.exit(1);
  }

  const reportKebab = toKebabCase(report);
  const reportCamel = toCamelCase(report);
  const reportPascal = toPascalCase(report);

  if (!reportKebab) {
    console.error('Nombre de reporte invalido.');
    process.exit(1);
  }

  const helperFileName = `${reportKebab}-field-map.helper.ts`;

  const projectRoot = process.cwd();
  const applicationDir = path.join(
    projectRoot,
    'src',
    'reports',
    'application',
    reportKebab,
  );
  const domainDir = path.join(
    projectRoot,
    'src',
    'reports',
    'domain',
    reportKebab,
  );
  const infrastructureDir = path.join(
    projectRoot,
    'src',
    'reports',
    'infrastructure',
    reportKebab,
  );

  fs.mkdirSync(applicationDir, { recursive: true });
  fs.mkdirSync(domainDir, { recursive: true });
  fs.mkdirSync(infrastructureDir, { recursive: true });

  /** @type {WriteResult[]} */
  const results = [];

  results.push(
    writeIfNeeded(
      path.join(infrastructureDir, `${reportKebab}-field-map.ts`),
      getFieldMapTemplate(reportCamel),
      force,
    ),
  );

  results.push(
    writeIfNeeded(
      path.join(infrastructureDir, helperFileName),
      getHelperTemplate(reportPascal, reportKebab, reportCamel),
      force,
    ),
  );

  results.push(
    writeIfNeeded(
      path.join(applicationDir, `get-${reportKebab}-report.use-case.ts`),
      getUseCaseTemplate(reportPascal, reportKebab, reportCamel),
      force,
    ),
  );

  results.push(
    writeIfNeeded(
      path.join(infrastructureDir, `${reportKebab}.mapper.ts`),
      getMappingConfigTemplate(reportPascal, reportKebab),
      force,
    ),
  );

  results.push(
    writeIfNeeded(
      path.join(domainDir, `${reportKebab}-report.types.ts`),
      getInterfaceTemplate(reportPascal),
      force,
    ),
  );

  results.push(
    writeIfNeeded(
      path.join(infrastructureDir, `${reportKebab}-report.schema.json`),
      getSchemaTemplate(),
      force,
    ),
  );

  results.push(
    writeIfNeeded(
      path.join(infrastructureDir, `${reportKebab}.permissions.filter.ts`),
      getPermissionsFilterTemplate(reportPascal),
      force,
    ),
  );

  results.push(
    writeIfNeeded(
      path.join(applicationDir, 'index.ts'),
      `export * from './get-${reportKebab}-report.use-case';\n`,
      force,
    ),
  );

  results.push(
    writeIfNeeded(
      path.join(domainDir, 'index.ts'),
      `export * from './${reportKebab}-report.types';\n`,
      force,
    ),
  );

  results.push(
    writeIfNeeded(
      path.join(infrastructureDir, 'index.ts'),
      `export * from './${reportKebab}-field-map';\nexport * from './${reportKebab}-field-map.helper';\nexport * from './${reportKebab}.mapper';\n`,
      force,
    ),
  );

  console.log('Generador de Field Map ejecutado:');
  for (const result of results) {
    const relativePath = path.relative(projectRoot, result.filePath);
    console.log(`- ${result.status.toUpperCase()}: ${relativePath}`);
  }

  console.log('\nSiguiente paso sugerido:');
  console.log(
    `1) Completa src/reports/infrastructure/${reportKebab}/${reportKebab}-field-map.ts`,
  );
  console.log(
    `2) Ajusta portales, schema, helpers y tipos en src/reports/domain/${reportKebab}/ y src/reports/infrastructure/${reportKebab}/`,
  );
  console.log(
    `3) Configura o registra el use case en src/reports/application/${reportKebab}/`,
  );
  console.log('4) Desarrolla el mapeo de campos de acuerdo a tus necesidades.');
}

main();
