import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

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
        'src/components/Reportes/**/*.{ts,tsx}',
        'src/shared/ui/ComingSoon/**/*.{ts,tsx}',
      ],
      exclude: ['src/setupTests.ts', '**/*.test.ts', '**/*.test.tsx'],
    },
  },
});
