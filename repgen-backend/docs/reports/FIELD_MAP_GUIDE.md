# Field Map Pattern Guide

Este patron permite usar nombres limpios en codigo y resolver al campo real de FileMaker.

## Navegacion De Documentacion

- [Indice general de reports](INDEX.md)
- [Indice de ADRs](ADR/VENTAS/ADR-INDEX.md)
- [Explicacion funcional del flujo](workflow/EXPLICACION_FLUJO_REPORTES.md)

## Archivos por reporte

Para un reporte `x` crea:

1. `src/reports/domain/x/x-report.types.ts`
2. `src/reports/infrastructure/x/x-field-map.ts`
3. `src/reports/infrastructure/x/x-field-map.helper.ts`
4. `src/reports/infrastructure/x/x.mapper.ts`
5. `src/reports/application/x/get-x-report.use-case.ts`

## Generador automatico

Comando:

```bash
npm run generate:field-map --report nombre-reporte
pnpm generate:field-map --report nombre-reporte
```

Opcional:

```bash
npm run generate:field-map --report nombre-reporte --force
```

Que crea:

1. `src/reports/domain/nombre-reporte/nombre-reporte-report.types.ts`
2. `src/reports/infrastructure/nombre-reporte/nombre-reporte-field-map.ts`
3. `src/reports/infrastructure/nombre-reporte/nombre-reporte-field-map.helper.ts`
4. `src/reports/infrastructure/nombre-reporte/nombre-reporte.mapper.ts`
5. `src/reports/infrastructure/nombre-reporte/nombre-reporte-report.schema.json`
6. `src/reports/application/nombre-reporte/get-nombre-reporte-report.use-case.ts`
7. `src/reports/domain/nombre-reporte/index.ts`
8. `src/reports/infrastructure/nombre-reporte/index.ts`
9. `src/reports/application/nombre-reporte/index.ts`

## Estructura del JSON

- La `key` es el nombre limpio (camelCase recomendado).
- El `value` es el nombre real de FileMaker.
- Puedes anidar objetos para portales.

Ejemplo:

```json
{
  "data": {
    "fecha": "_fecha",
    "cliente": {
      "rfc": "venta_|CLIENTE_|_x_clienteID::fiscal_RFC"
    }
  }
}
```

## Funciones minimas del helper

1. `getXRawFieldName(cleanPath: string): string | null`
2. `mapXRecordWithCleanKeys(record: RawRecord): Record<string, unknown>`
3. `mapXRecordsWithCleanKeys(records: RawRecord[]): Record<string, unknown>[]`

## Integracion recomendada en mapper

1. Crea `resolveXField(cleanPath, fallback)` que use `getXRawFieldName`.
2. Crea un objeto `X_RAW_FIELD_KEYS` con todas las llaves usadas por el mapper.
3. Reemplaza strings hardcodeados en mapeos y lecturas directas por `X_RAW_FIELD_KEYS`.
4. Conserva fallbacks para evitar romper ejecucion si falta alguna ruta en el JSON.

## Ejemplos ya aplicados

- Ventas:
  - `src/reports/infrastructure/sales/sales-field-map.ts`
  - `src/reports/infrastructure/sales/sales-field-map.helper.ts`
  - `src/reports/infrastructure/sales/sales.mapper.ts`

- Bancos:
  - `src/reports/infrastructure/banks/bank-field-map.ts`
  - `src/reports/infrastructure/banks/bank-field-map.helper.ts`
  - `src/reports/infrastructure/banks/banks.mapper.ts`
