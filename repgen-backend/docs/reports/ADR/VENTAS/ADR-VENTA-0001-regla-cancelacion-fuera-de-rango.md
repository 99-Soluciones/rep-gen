# ADR-Ventas-0001: Regla para cancelaciones cuando la factura original queda fuera del rango

## Estado

Aceptado

## Contexto

En el reporte de ventas, una factura puede haberse emitido en un mes y cancelado en otro. El caso relevante es cuando el usuario consulta un rango de fechas donde solo entra la cancelación, pero no la factura original.

Ejemplo:

- La factura se emitió en marzo.
- La cancelación ocurrió en abril.
- El usuario consulta el rango de abril.

Si en ese escenario se devolviera también la factura original, el reporte sumaría facturación que no pertenece al periodo consultado.

## Decisión

Cuando `fechaCFDICancelado` cae dentro del rango consultado:

- si la fecha de emisión de la factura también está dentro del rango, se devuelven el registro original y el registro cancelado;
- si la fecha de emisión de la factura queda fuera del rango, se devuelve solo el registro cancelado.

El registro cancelado se construye como una copia del registro limpio y se ajusta así:

- `facturaEstatus = 'Cancelada'`
- `facturaFecha = fechaCFDICancelado`
- importes en negativo
- saldo y pago en cero

## Consecuencias

### Positivas

- Evita sumar facturación fuera del periodo consultado.
- Mantiene visible el efecto contable de la cancelación dentro del rango.
- Hace el reporte más coherente con la fecha de análisis.

### Riesgos

- El comportamiento deja de ser simétrico entre factura y cancelación.
- Si no se conoce esta regla, puede parecer que falta un registro en el resultado.

## Alternativas consideradas

### 1. Devolver siempre factura original y cancelación

Rechazada porque el reporte podría inflar la facturación del periodo consultado.

### 2. Devolver solo la factura original

Rechazada porque se perdería el efecto contable de la cancelación en el rango actual.

### 3. Devolver solo la cancelación cuando la factura original está fuera del rango

Aceptada porque refleja mejor el periodo consultado y evita duplicar facturación.

## Relación con el codigo

La regla se aplica en el mapper de ventas, dentro de la lógica de cancelaciones.

Referencias:

- [sales.mapper.ts](../../../src/reports/infrastructure/sales/sales.mapper.ts)
- [EXPLICACION_FLUJO_REPORTES.md](../workflow/EXPLICACION_FLUJO_REPORTES.md)
