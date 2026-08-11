# JWT en cookie httpOnly (DOC-9.1-BE)

Documentación técnica del lado backend de la migración del JWT desde el cuerpo de la respuesta (leído y guardado en `localStorage` por el frontend) hacia una cookie `httpOnly`. Visión completa (frontend + backend + deploy) en `repgen-frontend/docs/AUTENTICACION_COOKIE_HTTPONLY.md`.

---

## 1. Motivo

Un JWT accesible desde JavaScript (`localStorage`, o expuesto en el body de la respuesta para que el frontend lo guarde donde quiera) puede ser robado por cualquier script inyectado vía XSS. Poner el token en una cookie `httpOnly` elimina esa vía: el navegador la manda automáticamente en cada request, pero ningún script del lado cliente puede leerla ni modificarla.

## 2. Cambios en este módulo

| Archivo | Cambio |
| --- | --- |
| `package.json` | Nueva dependencia `cookie-parser` (+ `@types/cookie-parser`) |
| `src/main.ts` | `app.use(cookieParser())` |
| `src/auth/auth.constants.ts` | **Nuevo.** `JWT_COOKIE_NAME = 'jwt_reportes'`, constante compartida entre el controller y el guard |
| `src/auth/auth.controller.ts` | `login-token` ahora setea la cookie (`setAuthCookie`) en vez de devolver `accessToken` en el body. Nuevos endpoints `GET /auth/me` y `POST /auth/logout` |
| `src/auth/guards/jwt.auth.guard.ts` | `extractTokenFromHeader` ahora lee primero `request.cookies[JWT_COOKIE_NAME]`; si no está, cae al header `Authorization: Bearer <token>` (compatibilidad) |

`auth.service.ts` **no cambió** — `validateTokenFileMaker` sigue devolviendo `{ accessToken, user }` exactamente igual; el controller es el único que decide qué hacer con el `accessToken` (antes: devolverlo en el body; ahora: ponerlo en una cookie).

## 3. Atributos de la cookie

```ts
response.cookie(JWT_COOKIE_NAME, accessToken, {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: JWT_EXPIRES_IN * 1000, // mismo valor que ya se usaba para firmar el JWT
  path: '/',
});
```

- **`sameSite: 'lax'`** (no `'none'`) porque el frontend nunca le habla a este backend cross-origin directamente — siempre pasa por un proxy same-origin (rewrite de Vercel en producción, proxy de Vite en desarrollo). Ver el doc del frontend para el detalle de por qué esto importa (Safari/ITP bloquea cookies cross-site de forma intermitente).
- **`secure`** solo en producción porque en desarrollo el proxy de Vite sirve todo por HTTP.
- **CORS no cambió** — `main.ts` ya tenía `credentials: true` con un origin específico (no wildcard), que es requisito para que cualquier cookie cross-context funcione. No fue necesario tocarlo.

## 4. Endpoints nuevos

### `GET /auth/me`

No lee nada del `request` — si la cookie falta o el JWT expiró, el `JwtAuthGuard` global ya devuelve `401` antes de que el handler se ejecute (esta ruta no lleva `@Public()`). Si llega a ejecutarse, la sesión es válida:

```ts
@Get('me')
me(): { ok: true } {
  return { ok: true };
}
```

Lo usa el frontend para decidir si puede "retomar sesión" al recargar la página sin un token fresco de FileMaker — antes se respondía esa pregunta leyendo `localStorage`, algo que ya no es posible con una cookie httpOnly.

### `POST /auth/logout`

Marcado `@Public()` a propósito — debe poder llamarse aunque la cookie ya haya expirado o no exista. Solo limpia la cookie:

```ts
@Post('logout')
@Public()
logout(@Res({ passthrough: true }) response: Response) {
  response.clearCookie(JWT_COOKIE_NAME, { path: '/' });
  return { message: 'Sesión cerrada' };
}
```

## 5. Sin cambios en persistencia

El JWT sigue siendo completamente stateless. FileMaker solo se consulta una vez, dentro de `validateTokenFileMaker`, para validar el token de un solo uso (`api_auth`) y borrarlo. Verificar el JWT en requests posteriores (`JwtAuthGuard`) es pura verificación de firma + expiración vía `jwtService.verifyAsync` — no hay ninguna tabla ni caché de sesiones. Migrar a refresh tokens con revocación (si se decide en el futuro) sí requeriría un almacén de estado — no fue necesario para este cambio.

## 6. Verificación

`pnpm test` (35/35) y `pnpm run build` sin errores. Además, verificación end-to-end real: se levantó el backend en `:3000` junto con el frontend (proxy de Vite hacia este backend) y se probó login → carga de datos autenticados → recarga de sesión vía `/auth/me` → logout vía `/auth/logout` seguido de `/auth/me` devolviendo `401`. Detalle completo en el doc del frontend.
