import { config } from './index';

/**
 * Microservice base URL configuration
 * Used as proxy targets for http-proxy-middleware
 */
export const services = {
    auth: config.AUTH_SERVICE_URL,
    trust: config.TRUST_SERVICE_URL,
} as const;

export type ServiceName = keyof typeof services;
