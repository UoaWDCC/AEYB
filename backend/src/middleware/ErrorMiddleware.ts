import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import ValidationError from '../types/ValidationError';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ErrorHandler(err: Error | mongoose.Error.ValidationError, req: Request, res: Response, next: NextFunction) {
    // Check if the error was thrown due to invalid inputs for a model
    if (err instanceof mongoose.Error.ValidationError) {
        res.status(400).json({
            status: 'errors',
            message: 'There was something wrong with your request',
            errors: getValidationErrors(err),
        });
        return;
    }

    const status = res.statusCode ?? 501;
    res.status(status).json({
        status: 'error',
        message: err.message,
    });
}

function getValidationErrors(error: mongoose.Error.ValidationError): ValidationError[] {
    return Object.values(error.errors).map((err) => {
        return {
            field: err.path,
            message: err.message,
        };
    });
}

export default ErrorHandler;
