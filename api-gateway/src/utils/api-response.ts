import { Response } from 'express';

/**
 * Standardized API response wrapper
 */
export class ApiResponse<T = unknown> {
    public readonly success: boolean;
    public readonly statusCode: number;
    public readonly message: string;
    public readonly data?: T;

    constructor(
        statusCode: number,
        message: string,
        data?: T
    ) {
        this.success = statusCode >= 200 && statusCode < 300;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
    }

    /**
     * Send response to client
     */
    send(res: Response): Response {
        return res.status(this.statusCode).json({
            success: this.success,
            message: this.message,
            ...(this.data !== undefined && { data: this.data }),
        });
    }

    /**
     * Factory methods for common response types
     */
    static ok<T>(res: Response, message = 'Success', data?: T) {
        return new ApiResponse(200, message, data).send(res);
    }

    static created<T>(res: Response, message = 'Created', data?: T) {
        return new ApiResponse(201, message, data).send(res);
    }

    static noContent(res: Response) {
        return res.status(204).send();
    }
}
