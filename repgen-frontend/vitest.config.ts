import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Los usuarios están en México: las pruebas de fechas deben correr en esa
// zona horaria también en CI (UTC), donde un desfase de día no se notaría.
process.env.TZ = 'America/Mexico_City';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: [
        'src/features/**/*.{ts,tsx}',
        'src/shared/ui/ComingSoon/**/*.{ts,tsx}',
      ],
      exclude: ['src/setupTests.ts', '**/*.test.ts', '**/*.test.tsx'],
    },
  },
});
