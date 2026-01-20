import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize, json } = winston.format;

/**
 * Custom log format for development
 */
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
});

/**
 * Winston logger instance
 * - JSON format in production
 * - Colorized console output in development
 */
export const logger = winston.createLogger({
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        config.NODE_ENV === 'production' ? json() : combine(colorize(), devFormat)
    ),
    transports: [
        new winston.transports.Console(),
    ],
    // Don't exit on uncaught exceptions
    exitOnError: false,
});

/**
 * Stream for Morgan-style request logging (if needed)
 */
export const loggerStream = {
    write: (message: string) => {
        logger.info(message.trim());
    },
};
