import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Request } from 'express';
import { services } from '../config/services';
import { logger } from '../lib/logger';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

/**
 * Base proxy options for auth service
 */
const baseProxyOptions: Options = {
    target: services.auth,
    changeOrigin: true,
    // Rewrite path: Express router strips /auth, so we need to add it back
    pathRewrite: (path) => `/auth${path}`,
    // Log proxy events
    on: {
        proxyReq: (proxyReq, req) => {
            const expressReq = req as Request;
            logger.debug('Proxying request to auth-service', {
                method: expressReq.method,
                originalUrl: expressReq.originalUrl,
                rewrittenPath: `/auth${expressReq.url}`,
                target: services.auth,
            });
        },
        proxyRes: (proxyRes, req) => {
            const expressReq = req as Request;
            logger.debug('Received response from auth-service', {
                status: proxyRes.statusCode,
                path: expressReq.originalUrl,
            });
        },
        error: (err, req) => {
            const expressReq = req as Request;
            logger.error('Proxy error to auth-service', {
                error: err.message,
                path: expressReq.originalUrl,
            });
        },
    },
};

/**
 * Proxy for public auth routes (register, login, refresh)
 * No authentication headers injected
 */
export const authPublicProxy = createProxyMiddleware({
    ...baseProxyOptions,
    on: {
        ...baseProxyOptions.on,
        proxyReq: (proxyReq, req) => {
            const expressReq = req as Request;

            // Strip any existing auth-related custom headers to prevent spoofing
            proxyReq.removeHeader('x-user-id');
            proxyReq.removeHeader('x-user-role');
            proxyReq.removeHeader('x-authenticated');
            proxyReq.removeHeader('x-logout');

            logger.debug('Proxying public auth request', {
                method: expressReq.method,
                path: expressReq.originalUrl,
            });
        },
    },
});

/**
 * Proxy for authenticated auth routes (logout)
 * Injects authentication context headers
 */
export const authProtectedProxy = createProxyMiddleware({
    ...baseProxyOptions,
    on: {
        ...baseProxyOptions.on,
        proxyReq: (proxyReq, req) => {
            const expressReq = req as AuthenticatedRequest;
            const user = expressReq.user;

            // Inject authentication context headers
            proxyReq.setHeader('x-user-id', user.userId);
            proxyReq.setHeader('x-user-role', user.role);
            proxyReq.setHeader('x-authenticated', 'true');

            // Strip Authorization header - downstream shouldn't verify JWT
            proxyReq.removeHeader('authorization');

            logger.debug('Proxying protected auth request', {
                method: expressReq.method,
                path: expressReq.originalUrl,
                userId: user.userId,
            });
        },
    },
});

/**
 * Proxy for logout - adds x-logout header
 */
export const authLogoutProxy = createProxyMiddleware({
    ...baseProxyOptions,
    on: {
        ...baseProxyOptions.on,
        proxyReq: (proxyReq, req) => {
            const expressReq = req as AuthenticatedRequest;
            const user = expressReq.user;

            // Inject authentication context headers
            proxyReq.setHeader('x-user-id', user.userId);
            proxyReq.setHeader('x-user-role', user.role);
            proxyReq.setHeader('x-authenticated', 'true');
            proxyReq.setHeader('x-logout', 'true');

            // Strip Authorization header
            proxyReq.removeHeader('authorization');

            logger.debug('Proxying logout request', {
                method: expressReq.method,
                path: expressReq.originalUrl,
                userId: user.userId,
            });
        },
    },
});
