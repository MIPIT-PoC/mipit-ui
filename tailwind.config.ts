/**
 * @file tailwind.config.ts
 * @description TailwindCSS configuration that scans every .ts/.tsx file under src/ for class names; no theme extensions or plugins are registered.
 * @author Nicolás Calderón
 * @project MIPIT-PoC — Cross-border Instant Payments Middleware
 */

import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
