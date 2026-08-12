#!/usr/bin/env node

/**
 * Install script for NestJS Winston + ELK logging setup
 * Installs all required dependencies automatically
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const packageJsonPath = resolve(process.cwd(), 'package.json');

if (!existsSync(packageJsonPath)) {
  console.error('package.json not found in current directory');
  process.exit(1);
}

const dependencies = [
  'winston',
  'winston-daily-rotate-file',
  '@elastic/elasticsearch',
  '@nestjs/config',
];

const devDependencies = ['@types/node'];

console.log('Installing logging dependencies...\n');

try {
  // Check if pnpm is available, fallback to npm
  let packageManager = 'npm';
  try {
    execSync('pnpm --version', { stdio: 'ignore' });
    packageManager = 'pnpm';
  } catch {
    console.log('Using npm (pnpm not found)\n');
  }

  // Install production dependencies
  console.log(`Installing production dependencies with ${packageManager}...`);
  const depString = dependencies.join(' ');
  const installCmd = packageManager === 'pnpm' 
    ? `pnpm add ${depString}`
    : `npm install ${depString}`;
  
  execSync(installCmd, { stdio: 'inherit' });

  // Install dev dependencies
  console.log(`\nInstalling dev dependencies with ${packageManager}...`);
  const devDepString = devDependencies.join(' ');
  const devInstallCmd = packageManager === 'pnpm' 
    ? `pnpm add -D ${devDepString}`
    : `npm install --save-dev ${devDepString}`;
  
  execSync(devInstallCmd, { stdio: 'inherit' });

  console.log('\nAll dependencies installed successfully!\n');
  console.log('Next steps:');
  console.log('1. Copy logger files from .github/skills/nestjs-logging/assets/ to src/common/logger/');
  console.log('2. Add LoggerModule to your AppModule imports');
  console.log('3. Set environment variables (LOG_LEVEL, LOG_DIR, ELK_ENABLED, etc.)');
  console.log('4. Inject LoggerService into your services');
  console.log('5. See SKILL.md for complete setup instructions\n');

} catch (error) {
  console.error('Installation failed:', error.message);
  process.exit(1);
}
