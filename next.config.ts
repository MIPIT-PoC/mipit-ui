/**
 * @file next.config.ts
 * @description Next.js configuration enabling standalone output for Docker images and a 2 MB body limit for server actions.
 * @author Carlos Mejía
 * @project MIPIT-PoC — Cross-border Instant Payments Middleware
 */

import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
};

export default config;
