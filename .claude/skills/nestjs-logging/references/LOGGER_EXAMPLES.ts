/**
 * EJEMPLO DE USO DEL LOGGER EN UN SERVICIO
 * Copia este código como referencia para tus servicios
 */

import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';

@Injectable()
export class EjemploServicio {
  constructor(private readonly logger: LoggerService) {}

  /**
   * Ejemplo 1: Log básico de información
   */
  operacionSimple() {
    this.logger.info('Iniciando operación simple');
    // ... código ...
    this.logger.info('Operación completada exitosamente');
  }

  /**
   * Ejemplo 2: Log con metadatos
   */
  buscarReportes(filtros: any) {
    const startTime = Date.now();

    this.logger.info('Buscando reportes', {
      filtroAño: filtros.año,
      filtroMes: filtros.mes,
      usuario: filtros.usuarioId,
      timestamp: new Date(),
    });

    try {
      // Simular búsqueda
      const resultados = [];

      const duracion = Date.now() - startTime;
      this.logger.info('Búsqueda completada', {
        registrosEncontrados: resultados.length,
        duracionMs: duracion,
        exitoso: true,
      });

      return resultados;
    } catch (error) {
      this.logger.error('Búsqueda falló', error, {
        filtros: filtros,
        paso: 'queryExecution',
        intentos: 1,
      });
      throw error;
    }
  }

  /**
   * Ejemplo 3: Log de advertencia
   */
  validarPermiso(userId: string) {
    this.logger.info('Validando permiso', { userId });

    if (!userId) {
      this.logger.warn('Intento de acceso sin autenticación', {
        ip: '192.168.1.100',
        timestamp: new Date(),
      });
      return false;
    }

    return true;
  }

  /**
   * Ejemplo 4: Log de error con stack trace
   */
  async procesarDatos(datos: any) {
    this.logger.info('Procesando datos', { registros: datos.length });

    try {
      // Simular error
      const resultado = await this.operacionAsincrona(datos);
      this.logger.info('Datos procesados correctamente');
      return resultado;
    } catch (error: any) {
      this.logger.error('Error durante el procesamiento', error, {
        datosRecibidos: datos.length,
        estadoActual: 'procesando',
        pasoFallido: 'transformacion',
        severidad: 'high',
      });
      throw error;
    }
  }

  /**
   * Ejemplo 5: Log de debug (visible solo con LOG_LEVEL=debug)
   */
  operacionDebug() {
    this.logger.debug('Información de depuración', {
      estado: 'iniciado',
      memoria: process.memoryUsage(),
      timestamp: new Date(),
    });

    // ... código ...

    this.logger.debug('Paso 1: Conexión establecida', {
      conexionId: 'conn-123',
      tiempoMs: 150,
    });

    this.logger.debug('Paso 2: Datos obtenidos', {
      registros: 100,
      tamanoMB: 2.5,
    });
  }

  /**
   * Ejemplo 6: Seguimiento de transacciones
   */
  async transaccionCompleja(transaccionId: string) {
    const startTime = Date.now();
    const metadata = {
      transaccionId,
      usuarioId: 'user-123',
      iniciado: new Date(),
    };

    this.logger.info('Transacción iniciada', metadata);

    try {
      // Paso 1
      this.logger.debug('Paso 1: Validación', {
        ...metadata,
        paso: 1,
      });
      await this.validar();

      // Paso 2
      this.logger.debug('Paso 2: Procesamiento', {
        ...metadata,
        paso: 2,
      });
      const resultado = await this.procesar();

      // Paso 3
      this.logger.debug('Paso 3: Confirmación', {
        ...metadata,
        paso: 3,
      });
      await this.confirmar();

      const duracion = Date.now() - startTime;
      this.logger.info('Transacción completada', {
        ...metadata,
        duracionMs: duracion,
        estado: 'success',
      });

      return resultado;
    } catch (error) {
      const duracion = Date.now() - startTime;
      this.logger.error('Transacción falló', error, {
        ...metadata,
        duracionMs: duracion,
        estado: 'failed',
      });
      throw error;
    }
  }

  /**
   * Ejemplo 7: Logging condicional
   */
  operacionConMuestreo(datos: any) {
    // Log cada 10 operaciones (para no saturar con volumen alto)
    if (Math.random() > 0.9) {
      this.logger.info('Operación procesada', {
        registros: datos.length,
        muestreado: true,
      });
    }
  }

  // Métodos auxiliares
  private async operacionAsincrona(datos: any) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ procesado: true });
      }, 100);
    });
  }

  private async validar() {
    return true;
  }

  private async procesar() {
    return { resultado: 'ok' };
  }

  private async confirmar() {
    return true;
  }
}

/**
 * PATRONES RECOMENDADOS
 */

// ✅ BIEN: Log al inicio y fin
export class BuenoPractica1 {
  private logger!: LoggerService;

  procesarVentas(filtro: any) {
    this.logger.info('Procesando ventas', { filtro });
    // ... código ...
    this.logger.info('Ventas procesadas');
  }
}

// ✅ BIEN: Capturar errores con contexto
export class BuenoPractica2 {
  private logger!: LoggerService;

  async guardarDatos(datos: any) {
    try {
      await this.db.save(datos);
      this.logger.info('Datos guardados');
    } catch (error) {
      this.logger.error('Error al guardar', error, {
        datosIntentados: datos.id,
      });
      throw error;
    }
  }
}

// ❌ MALO: No loguear
export class MalaPractica1 {
  procesarDatos(datos: any) {
    // Sin logs - difícil de debuggear
    return datos;
  }
}

// ❌ MALO: Loguear información sensible sin redactar
export class MalaPractica2 {
  private logger!: LoggerService;

  login(credentials: any) {
    // ¡No hagas esto! Expone credenciales
    this.logger.info('Login attempt', { password: credentials.password });
  }
}

// ❌ MALO: Logs en todos lados sin contexto
export class MalaPractica3 {
  private logger!: LoggerService;

  procesarDatos(datos: any) {
    this.logger.info('1');
    this.logger.info('2');
    this.logger.info('3');
    // Sin contexto - no se entiende qué está pasando
  }
}

/**
 * COMANDOS ÚTILES PARA INSPECCIONAR LOGS
 */

// En PowerShell/Terminal:
/*
// Ver últimos 50 logs
Get-Content logs/combined-*.log -Tail 50

// Ver solo errores
Select-String "error" logs/error-*.log

// Buscar un usuario específico
Select-String "userId:123" logs/combined-*.log

// Contar errores por día
Get-ChildItem logs/error-*.log | Measure-Object -Line

// Ver logs en tiempo real
Get-Content logs/combined-*.log -Wait

// Exportar logs del últimos 24 horas a archivo
Get-ChildItem logs/combined-*.log -NewerThan (Get-Date).AddHours(-24) | 
  Get-Content | Out-File reporte-logs.txt
*/
