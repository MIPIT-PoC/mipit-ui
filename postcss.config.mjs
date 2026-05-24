/**
 * @file postcss.config.mjs
 * @description PostCSS configuration that loads the @tailwindcss/postcss plugin for the Next.js app.
 * @author Carlos Mejía
 * @project MIPIT-PoC — Cross-border Instant Payments Middleware
 */

const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
