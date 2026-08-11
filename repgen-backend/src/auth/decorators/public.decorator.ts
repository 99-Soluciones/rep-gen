import { SetMetadata } from '@nestjs/common';

/// Clave utilizada para marcar rutas como públicas en el sistema de autenticación JWT.
// Las rutas marcadas con esta clave serán excluidas de la protección del guardia JWT, permitiendo el acceso sin necesidad de un token de autenticación.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
