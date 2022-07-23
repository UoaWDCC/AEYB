import { NextFunction, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import config from '../types/Config';
import jwt from 'jsonwebtoken';
import User from '../models/UserModel';
import Permission from '../types/Perm';
import { getPermissions } from '../controllers/UserController';
import { TypedRequest } from '../types/UtilTypes';

type AuthenticationFunction = (req: Request<unknown>, res: Response, next: NextFunction) => void;

export default function protect(permission?: Permission): AuthenticationFunction {
    return asyncHandler(async (req: Request<unknown>, res: Response, next: NextFunction) => {
        // The token will be in the format Bearer <token>
        if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
            res.status(401).json({
                status: 'error',
                message: 'You must specify a bearer token to access this endpoint',
            });
            return;
        }
        try {
            const token = req.headers.authorization.split(' ')[1];

            // Verify token:
            const decoded = jwt.verify(token, config.jwtSecret);
            const user = await User.findById(decoded.sub ?? '');
            if (!user) {
                res.status(401).json({
                    status: 'error',
                    message: 'Invalid bearer token',
                });
                return;
            }

            // Don't bother fetching the user permissions if they just need to be logged in
            if (permission !== undefined) {
                // Check that the user has the required permission
                const userPermissions = await getPermissions(user);
                if (!userPermissions.has(permission)) {
                    res.status(401).json({
                        status: 'error',
                        message: `You require the ${permission} permission to access this endpoint`,
                    });
                    return;
                }
            }

            // Make the user accessible in the body of the request.
            (req as TypedRequest<unknown, unknown>).body.requester = user;

            next();
        } catch (error) {
            res.status(401).json({
                status: 'error',
                message: 'Something went wrong while authenticating the request: ' + (error as Error).message,
            });
        }
    });
}
