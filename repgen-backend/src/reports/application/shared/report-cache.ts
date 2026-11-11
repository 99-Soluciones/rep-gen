import type { Cache } from '@nestjs/cache-manager';

/**
 * Devuelve lo cacheado con `key`; si no existe, ejecuta `load`, guarda el
 * resultado y lo devuelve. Solicitudes simultáneas con la misma clave
 * comparten una sola carga (`inFlight`). Con `refresh` se ignora lo cacheado
 * ("Actualizar datos"): se vuelve a cargar y se reemplaza.
 */
export async function fetchCached<T>(
  cache: Cache,
  inFlight: Map<string, Promise<T>>,
  key: string,
  load: () => Promise<T>,
  refresh = false,
): Promise<T> {
  const cached = refresh ? undefined : await cache.get<T>(key);
  if (cached) return cached;

  const pending = inFlight.get(key);
  if (pending) return pending;

  const request = (async () => {
    const value = await load();
    await cache.set(key, value);
    return value;
  })();
  inFlight.set(key, request);
  try {
    return await request;
  } finally {
    inFlight.delete(key);
  }
}
