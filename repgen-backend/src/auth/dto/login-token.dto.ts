import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class LoginTokenDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  /**
   * Nombre de la base de datos de FileMaker. Llega del cliente y termina en la
   * URL de la Data API, así que solo se aceptan letras, dígitos, espacio, "_" y "-".
   */
  @IsString()
  @Matches(/^[\p{L}\p{N} _-]{1,100}$/u, { message: 'Tenant inválido' })
  tenant!: string;
}
