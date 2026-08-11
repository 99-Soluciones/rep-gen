# ADR-0002: Regla para devoluciones cuando la factura original queda fuera del rango

## Estado

Aceptado

## Contexto

En el reporte de ventas, una factura puede emitirse en un periodo y tener una devolución en otro. El caso importante es cuando el usuario consulta un rango de fechas donde solo entra la devolución, pero no la factura original.

Ejemplo:

- La factura se emitió en marzo.
- La devolución ocurrió en abril.
- El usuario consulta el rango de abril.

Si en ese escenario se devolviera también la factura original, el reporte sumaría facturación que no pertenece al periodo consultado.

## Decisión

Cuando existe una devolución y su fecha cae dentro del rango consultado:

- si la factura original también cae dentro del rango, se devuelve solo el registro original;
- si la factura original queda fuera del rango, se devuelve solo el registro de devolución.

El registro de devolución se construye como una copia del registro limpio y se ajusta así:

- `facturaEstatus = 'Devolución'`
- `facturaUsoCfdi = '04 - Devolución de mercancía'`
- `facturaMetodoPago = 'PUE - Pago en parcialidades o diferido'`
- importes en negativo
- `facturaSaldoActual = 0`
- `facturaTasaPagada = 0`

## Consecuencias

### Positivas

- Evita sumar facturación fuera del periodo consultado.
- Mantiene visible el efecto contable de la devolución dentro del rango.
- Hace el reporte más coherente con la fecha de análisis.

### Riesgos

- El comportamiento deja de ser simétrico entre factura original y devolución.
- Si no se conoce esta regla, puede parecer que falta un registro en el resultado.

## Alternativas consideradas

### 1. Devolver siempre factura original y devolución

Rechazada porque el reporte podría inflar la facturación del periodo consultado.

### 2. Devolver solo la factura original

Rechazada porque se perdería el efecto contable de la devolución en el rango actual.

### 3. Devolver solo la devolución cuando la factura original está fuera del rango

Aceptada porque refleja mejor el periodo consultado y evita duplicar facturación.

## Relación con el codigo

La regla se aplica en el mapper de ventas, dentro de la lógica de devoluciones.

Referencias:

- [sales.mapper.ts](../../../src/reports/infrastructure/sales/sales.mapper.ts)
- [EXPLICACION_FLUJO_REPORTES.md](../workflow/EXPLICACION_FLUJO_REPORTES.md)
