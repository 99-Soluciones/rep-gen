# Etiquetas de columnas por tenant (Column Labels)

Documentación funcional y técnica (backend y frontend) de la personalización de encabezados de columnas en reportes según la configuración de cada cliente (tenant) en FileMaker.

---

## 1. Objetivo de negocio

Cada tenant puede usar nombres distintos para sus clasificaciones de **cliente** (ej. Canal, Ruta, Zona) y de **artículo** (ej. Línea, Familia, Subfamilia). Esos nombres viven en FileMaker; RepGen los expone a la UI para que AG Grid muestre encabezados correctos sin redeploy del frontend.

| Sin column labels | Con column labels |
|-------------------|-------------------|
| Encabezado fijo «Clasificación 1» | Encabezado «CANAL» (valor del tenant) |
| Mismo texto para todos los clientes | Texto por base de datos FM (`tenant`) |

---

## 2. Conceptos

| Concepto | Descripción |
|----------|-------------|
| **Tenant** | Nombre de la base FileMaker / cliente; viaja en el JWT (`payload.tenant`) y en login (`?tenant=`). |
| **Slot** | Identificador lógico `grupo.clave`, ej. `cliente.clasificacion1`, `articulo.categoria2`. |
| **labelSlot** | Propiedad en el `*.schema.json` del reporte que enlaza una columna con un slot. |
| **defaultHeader** | Texto en español genérico si no hay etiqueta en FM o falla la API. |
| **Layout FM `columnas_prefs`** | Origen de datos; un registro con los 8 textos de preferencia. |

Slots soportados hoy (8 en total):

```text
cliente.clasificacion1 … cliente.clasificacion4
articulo.categoria1    … articulo.categoria4
```

Los usan Ventas (`features/reports/sales/ventas.schema.json`) y Cuentas por cobrar (`features/reports/receivables/cxc.schema.json`, solo los de cliente). Los resuelve `resolverSlot` en `column-labels.context.ts`.

---

## 3. Flujo de extremo a extremo

```mermaid
sequenceDiagram
  participant FM as FileMaker
  participant API as TenantController
  participant SVC as TenantService
  participant CACHE as Cache (10 min)
  participant FE as ColumnLabelsProvider
  participant GRID as AG Grid (Ventas)

  Note over FE: Tras login, JWT en cookie httpOnly, tenant en localStorage
  FE->>API: GET /api/v1/tenant/column-labels<br/>Cookie: jwt_reportes
  API->>API: JwtAuthGuard → req.tenant
  SVC->>CACHE: get column-labels:{tenant}
  alt cache hit
    CACHE-->>SVC: ColumnLabelsResponse
  else cache miss
    SVC->>FM: GET layout columnas_prefs (db = tenantId)
    FM-->>SVC: fieldData (8 campos)
    SVC->>SVC: mapColumnLabelsRecord
    SVC->>CACHE: set TTL 10 min
  end
  SVC-->>FE: JSON cliente + articulo
  FE->>FE: sessionStorage repgen:column-labels:{tenant}
  GRID->>FE: getLabel("cliente.clasificacion1")
  FE-->>GRID: "CANAL" o undefined → defaultHeader
```

### Orden en la aplicación

1. Usuario entra desde FileMaker con `?token=…&tenant=miBase`.
2. `POST /auth/login-token` genera JWT con `tenant: dbName` y lo guarda en la cookie httpOnly `jwt_reportes`.
3. `app/App.tsx` monta `<ColumnLabelsProvider tenant={tenant}>` dentro de `AuthGate`, ya con sesión.
4. El provider llama `GET /tenant/column-labels` vía `apiFetch`; el navegador envía la cookie.
5. La página del reporte (`ReporteVentas`, `ReporteCuentasPorCobrar`) usa `useColumnLabels().getLabel` al construir columnas.
6. `ColumnBuilder` usa `labelSlot` + `labelResolver` → `headerName` final.

---

## 4. API REST

### Request

```http
GET /api/v1/tenant/column-labels HTTP/1.1
Host: localhost:3000
Cookie: jwt_reportes=<jwt>
```

- **Autenticación:** obligatoria (`JwtAuthGuard`). El guard lee primero la cookie `jwt_reportes`; si no está, acepta `Authorization: Bearer <jwt>` (respaldo para clientes sin cookie, p. ej. `curl`). Ver `docs/auth/AUTH_COOKIE_HTTPONLY.md`.
- **Tenant:** no va en query; se toma de `req.tenant` (claim del JWT).
- **Throttle:** límite global del app (100 req/min), sin throttle específico.

### Response 200 — `ColumnLabelsResponse`

```json
{
  "cliente": {
    "clasificacion1": "CANAL",
    "clasificacion2": "RUTA",
    "clasificacion3": "ZONA",
    "clasificacion4": ""
  },
  "articulo": {
    "categoria1": "LÍNEA",
    "categoria2": "FAMILIA",
    "categoria3": "SUBFAMILIA",
    "categoria4": ""
  }
}
```

- Strings vacíos si FM no tiene valor o solo espacios (el mapper hace `trim`).
- El frontend trata cadena vacía como «sin etiqueta» y cae en `defaultHeader`.

### Errores

| Código | Cuándo | Mensaje típico |
|--------|--------|----------------|
| 401 | Sin JWT o inválido | Token no proporcionado / Token inválido |
| 400 | `req.tenant` vacío | Tenant ID is required |
| 404 | Sin registros en `columnas_prefs` | No column labels found |
| 5xx | FM caído / sin sesión | Error FileMaker (vía `FileMakerService`) |

---

## 5. Backend

### Archivos

| Archivo | Rol |
|---------|-----|
| `tenant/presentation/tenant.controller.ts` | Endpoint HTTP |
| `tenant/tenant.service.ts` | Cache + llamada FM + orquestación |
| `tenant/domain/column-labels.ts` | Tipos `ColumnLabelsRecord`, `ColumnLabelsResponse` |
| `tenant/infrastructure/column-labels-field-map.ts` | Nombres reales de campos FM |
| `tenant/infrastructure/column-labels.mapper.ts` | Record → Response |
| `filemaker/relations/_column-labels.ts` | Prefijos de relación para campos portal |
| `filemaker/filemaker.service.ts` | `getAllRecords(tenantId, 'columnas_prefs')` |

### FileMaker

- **Base de datos:** `tenantId` (mismo string que en login/JWT).
- **Layout:** `columnas_prefs`.
- **Operación:** `getAllRecords` — se usa el **primer registro** (`data[0]`).
- Si no hay registros → `NotFoundException`.

### Relaciones (`_column-labels.ts`)

```typescript
export const columnLabelsRelations = {
  _: `_prefCLIENTE`,           // campos cliente en layout principal
  prefInv: {
    _: `_prefCliente_|_pref.invITM_|_x`,  // campos artículo vía relación
  },
};
```

### Field map (campos FM)

| Slot API (cliente) | Campo FileMaker (simplificado) |
|--------------------|--------------------------------|
| clasificacion1–4 | `classify1_name_v0_20_0` … `classify4_name_v0_20_0` en pref cliente |
| categoria1–4 | `…::classify1_name_v0_20_0` … en relación `prefInv` |

Código: `column-labels-field-map.ts` (construye nombres con `columnLabelsRelations`).

### Caché

| Parámetro | Valor |
|-----------|--------|
| Clave | `column-labels:{tenantId}` |
| TTL al guardar | 10 minutos (`10 * 60 * 1000` ms) |
| Store | `@nestjs/cache-manager` (`CacheModule` en `TenantModule`) |

Tras cambiar textos en FileMaker, el cambio puede tardar hasta 10 min en API o hay que invalidar cache / reiniciar instancia.

### Mapper

`mapColumnLabelsRecord`:

- Agrupa 8 campos planos del record en `cliente.*` y `articulo.*`.
- `empty()` → `trim` o `''`.

Tests: `column-labels.mapper.spec.ts`.

---

## 6. Frontend

### Archivos

| Archivo | Rol |
|---------|-----|
| `features/reports/shared/api/column-labels.api.ts` | `fetchColumnLabels()` |
| `features/reports/shared/column-labels/ColumnLabelsProvider.tsx` | Estado, fetch, cache local |
| `features/reports/shared/column-labels/column-labels.context.ts` | Context, `resolverSlot`, sessionStorage |
| `features/reports/shared/column-labels/useColumnLabels.ts` | Hook `getLabel`, `labels`, `isLoading` |
| `app/App.tsx` | Monta el provider con el tenant de la sesión (tras `AuthGate`) |
| `features/reports/shared/ag-grid/construir-columnas.ts` | `resolverNombreEncabezado` |
| `features/reports/sales/ventas.schema.json` | `labelSlot` por columna |
| `features/reports/sales/columnas.ts` | `construirColumnasVentas(schema, getLabel)` |

### Montaje del provider

Solo cuando la autenticación fue exitosa:

```tsx
<AuthGate>
  {({ tenant, reporteInicio }) => (
    <ColumnLabelsProvider tenant={tenant}>
      <AppRouter reporteInicio={reporteInicio} />
    </ColumnLabelsProvider>
  )}
</AuthGate>
```

`tenantActivo` sale de `user.tenant` tras login o de `localStorage["usuario:v1"]` (sesión retomada y confirmada con `GET /auth/me`).

### Contrato del contexto (`useColumnLabels`)

| Propiedad | Descripción |
|-----------|-------------|
| `labels` | Objeto completo `cliente` + `articulo` (`ColumnLabelsResponse` de `@repgen/shared-types`) |
| `getLabel(slot)` | Texto del slot, o `undefined` si está vacío |
| `isLoading`, `error` | Estado del último fetch; puede haber `error` y etiquetas de caché a la vez |
| `refreshLabels()` | Vuelve a pedirlas (hoy ningún botón lo usa) |

El hook lanza si se usa fuera de `ColumnLabelsProvider`.

### Resiliencia

1. Al montar: lee `sessionStorage` (`repgen:column-labels:{tenant}`) para pintar rápido.
2. Fetch a API; si OK → actualiza estado y storage.
3. Si fetch falla pero hay cache en session → usa cache y guarda `error`.
4. `getLabel(slot)` → `undefined` si no hay texto → AG Grid usa `defaultHeader`; sin `defaultHeader`, la clave de la columna en el schema.
5. Al cambiar de tenant el provider se remonta (`key={tenant}`): no se mezclan etiquetas de otro cliente.

### Resolución del encabezado (AG Grid)

En `construir-columnas.ts`:

```typescript
if (meta.labelSlot && labelResolver) {
  const etiqueta = labelResolver(meta.labelSlot);
  if (etiqueta) return etiqueta;
}
return meta.defaultHeader ?? encabezadoFallback;
```

### Ejemplo en schema (ventas)

```json
"clasificacion1": {
  "field": "clasificacion1",
  "dataType": "text",
  "columnClass": "Clientes",
  "defaultHeader": "Clasificación 1",
  "labelSlot": "cliente.clasificacion1"
}
```

**Bancos** no declara `labelSlot` en su schema; hoy consumen etiquetas dinámicas **Ventas** y **Cuentas por cobrar**.

---

## 7. Tabla slot → columna ventas

| labelSlot | Campo dato (`field`) | defaultHeader |
|-----------|----------------------|---------------|
| `cliente.clasificacion1` | `clasificacion1` | Clasificación 1 |
| `cliente.clasificacion2` | `clasificacion2` | Clasificación 2 |
| `cliente.clasificacion3` | `clasificacion3` | Clasificación 3 |
| `cliente.clasificacion4` | `clasificacion4` | Clasificación 4 |
| `articulo.categoria1` | `categoriadeProducto1` | Categoría 1 |
| `articulo.categoria2` | `categoriadeProducto2` | Categoría 2 |
| `articulo.categoria3` | `categoriadeProducto3` | Categoría 3 |
| `articulo.categoria4` | `categoriadeProducto4` | Categoría 4 |

Los **valores de las celdas** vienen del reporte de ventas; los **encabezados** vienen de column labels.

---

## 8. Cómo extender

### Nuevo slot (requiere cambio en FM + API + FE)

1. Añadir campos en layout `columnas_prefs` y field map backend.
2. Extender `ColumnLabelsRecord` / `ColumnLabelsResponse`.
3. Si es un grupo nuevo (además de `cliente` y `articulo`), ampliar `resolverSlot` y el tipo en `packages/shared-types`.
4. Poner `labelSlot` en el `*.schema.json` del reporte.

### Usar etiquetas en otro reporte (solo UI)

1. En su `*.schema.json`: `labelSlot` + `defaultHeader` en la columna.
2. Pasar `getLabel` al `ColumnBuilder` de ese reporte (ver `receivables/columnas.ts`).
3. No hace falta otro provider: envuelve toda la app autenticada.

---

## 9. Troubleshooting

| Síntoma | Revisar |
|---------|---------|
| Siempre «Clasificación 1» genérico | ¿API 200? ¿`labelSlot` en schema? ¿`getLabel` devuelve string no vacío? |
| 404 en API | ¿Existe registro en `columnas_prefs` para esa base? |
| 401 | Cookie `jwt_reportes` ausente o expirada (DevTools → Application → Cookies); re-login desde FileMaker |
| Etiquetas de otro tenant | `ColumnLabelsProvider` tiene `key={tenant}`; borrar `sessionStorage` `repgen:column-labels:*` |
| Cambio en FM no se ve | Cache backend 10 min; sessionStorage en pestaña |
| Encabezado con espacios raros | Mapper ya hace `trim` |

### Comandos / pruebas manuales

```bash
# Backend — test mapper
cd repgen-backend && pnpm test -- column-labels.mapper.spec

# API (sustituir TOKEN; el tenant viaja dentro del JWT)
curl -s --cookie "jwt_reportes=TOKEN" \
  http://localhost:3000/api/v1/tenant/column-labels | jq
# También funciona con -H "Authorization: Bearer TOKEN" (respaldo del guard)
```

---

## 10. Seguridad

- Un usuario solo obtiene labels del **tenant embebido en su JWT**; no se acepta `tenant` por query en este endpoint.
- No incluir en logs de producción el JSON completo de labels si puede considerarse dato interno del cliente (hoy `TenantService` loguea la respuesta en nivel `log` — valorar reducir en prod).

---

## 11. Referencias cruzadas

- Login y JWT: `repgen-backend/docs/auth/AUTH_COOKIE_HTTPONLY.md`
- Flujo de reportes: `repgen-backend/docs/reports/workflow/EXPLICACION_FLUJO_REPORTES.md`
