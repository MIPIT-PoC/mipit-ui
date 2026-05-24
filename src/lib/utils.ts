/**
 * @file utils.ts
 * @description Generic UI helpers; exports `cn` which composes class names through clsx and resolves Tailwind class collisions via tailwind-merge.
 * @author Nicolás Calderón
 * @project MIPIT-PoC — Cross-border Instant Payments Middleware
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
