import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import { DevLoginRequest, LoginRequest } from '../types/RequestTypes';
import User, { UserModel } from '../models/UserModel';
import jwt from 'jsonwebtoken';
import config from '../types/Config';
import { OAuth2Client } from 'google-auth-library';
import Permission from '../types/Perm';
import { AuthenticatedRequest, Doc, TypedRequestBody } from '../types/UtilTypes';
import { UserIdParam } from '../types/RequestParams';
import { TypedRequest } from '../types/UtilTypes';
import Role, { RoleModel } from '../models/RoleModel';

const client = new OAuth2Client(config.clientID);

/**
 * @desc    An endpoint that is only accessible during development for getting a JWT token for the specified user id.
 * @route   POST api/users/devlogin
 */
const devLoginUser = asyncHandler(async (req: TypedRequestBody<DevLoginRequest>, res: Response) => {
    const userId = req.body.id;

    let user = await User.findById(userId);
    if (!user) {
        user = await User.create({ _id: userId, name: req.body.name, profileUrl: req.body.profileUrl });
    }

    res.status(200).json({
        status: 'success',
        token: generateJWT(user.id),
        data: {
            user,
            permissions: [...(await getPermissions(user))], // Apparently it doesn't like sets
        },
    });
});

/**
 * @desc    Login and gain an access token
 * @route   POST api/users/login
 */
const loginUser = asyncHandler(async (req: TypedRequestBody<LoginRequest>, res: Response) => {
    const credential = req.body.credential;

    if (typeof credential !== 'string') {
        res.status(400).json({
            status: 'error',
            message: `The credential must be a string (got ${typeof credential})`,
        });
        return;
    }

    try {
        const userId = await validateIdToken(credential, res);
        if (!userId) return;

        let user = await User.findById(userId);
        // TODO: Determine if name can be extracted from id token
        // TODO: Profile picture
        if (!user) {
            user = await User.create({ _id: userId, name: 'TODO' });
        } else {
            // TODO: Check that the profile picture and name haven't been changed
        }

        // The returned token can then be used to authenticate additional requests
        res.status(200).json({
            status: 'success',
            token: generateJWT(user.id),
            data: {
                user,
                permissions: await getPermissions(user),
            },
        });
    } catch (error) {
        res.status(400).json({
            status: 'error',
            message: 'Something went wrong while validating id token',
        });
    }
});

// Reference: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

async function validateIdToken(credential: string, res: Response): Promise<string | undefined> {
    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: config.clientID,
    });

    const payload = ticket.getPayload();
    const userId = payload?.sub;
    if (!userId) {
        res.status(400).json({
            status: 'error',
            message: 'The id token provided was malformed',
        });
        return;
    }

    const domain = payload.hd;
    // When not in development, make sure users logging in have the correct email domain
    if (config.nodeEnv !== 'development' && domain !== config.googleDomain) {
        res.status(404).json({
            status: 'error',
            message: 'Invalid google domain',
        });
    }
    return userId;
}

function generateJWT(userId: string): string {
    return jwt.sign({ sub: userId }, config.jwtSecret, {
        expiresIn: '30d',
    });
}

/**
 * @desc 	Get all the users
 * @route 	GET /api/users/
 */
const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await User.find();

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users,
        },
    });
});

/**
 * @desc    Get information about the currently logged in user
 * @route   GET /api/users/@me
 */
const getSelf = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const self = req.body.requester;

    res.status(200).json({
        status: 'success',
        data: {
            self,
            permissions: [...(await getPermissions(self))],
        },
    });
});

/**
 * @desc 	Get a specific user
 * @route 	GET /api/users/:userId
 */
const getUser = asyncHandler(async (req: Request<UserIdParam>, res: Response) => {
    const user = await User.findById(req.params.userId);
    if (!user) {
        res.status(404).json({
            status: 'error',
            message: `There is no user with the id ${req.params.userId}`,
        });
        return;
    }

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

/**
 * @desc    Edit a specific User
 * @route   PATCH /api/users/:userId
 */
const updateUser = asyncHandler(async (req: TypedRequest<UserModel, UserIdParam>, res: Response) => {
    const user = await User.findByIdAndUpdate(req.params.userId, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

async function getPermissions(user: Doc<UserModel>): Promise<Set<Permission>> {
    if (!user.populated('roles')) await user.populate('roles');

    // https://newbedev.com/how-do-i-convert-a-string-to-enum-in-typescript
    return new Set(
        user.roles
            .flatMap((role) => role.permissions)
            .map((permission) => Permission[permission as keyof typeof Permission]),
    );
}

/**
 * @desc 	Gives user roles specified in request body
 * @route 	POST /api/users/:userId/roles/
 */
const giveRoles = asyncHandler(async (req: TypedRequest<{ roles: string[] }, UserIdParam>, res: Response) => {
    //Check roles is provided as an array
    if (!Array.isArray(req.body.roles)) {
        res.status(400).json({
            status: 'error',
            message: 'Roles must be an array',
        });
        return;
    }

    // Check atleast one role specified
    if (req.body.roles.length == 0) {
        res.status(400).json({
            status: 'error',
            message: 'You must specify atleast one role',
        });
        return;
    }

    // Get the user
    const user = await User.findById(req.params.userId);
    if (!user) {
        res.status(400).json({
            status: 'error',
            message: 'User not found',
        });
        return;
    }

    const addedRoles: RoleModel[] = [];

    for (const roleId of req.body.roles) {
        // Check if role exists
        const role = await Role.findById(roleId);
        if (!role) {
            res.status(400).json({
                status: 'error',
                message: 'Role not found',
            });
            return;
        }

        // Check if the user already has the role
        if (user.roles.includes(role.id)) {
            res.status(400).json({
                status: 'error',
                message: 'User already has that role',
            });
            return;
        }

        // Check if trying to add the same role twice
        if (addedRoles.includes(role.id)) {
            res.status(400).json({
                status: 'error',
                message: 'You cannot add the same role twice',
            });
            return;
        }

        addedRoles.push(role);
    }

    // Give the roles to the user
    user.roles = user.roles.concat(addedRoles);

    await user.save();

    res.status(200).json({
        status: 'success',
        rolesAdded: addedRoles.length,
        data: {
            user,
            addedRoles,
        },
    });
});

/**
 * @desc 	Removes roles specified in request body from a user
 * @route 	DELETE /api/users/:userId/roles/
 */
const removeRoles = asyncHandler(async (req: TypedRequest<{ roles: string[] }, UserIdParam>, res: Response) => {
    //Check roles is provided as an array
    if (!Array.isArray(req.body.roles)) {
        res.status(400).json({
            status: 'error',
            message: 'Roles must be an array',
        });
        return;
    }

    // Check atleast one role specified
    if (req.body.roles.length == 0) {
        res.status(400).json({
            status: 'error',
            message: 'You must specify atleast one role',
        });
        return;
    }

    // Get the user
    const user = await User.findById(req.params.userId).populate('roles');
    if (!user) {
        res.status(400).json({
            status: 'error',
            message: 'User not found',
        });
        return;
    }

    const removedRoles: RoleModel[] = [];

    for (const roleId of req.body.roles) {
        // Check if role exists
        const role = await Role.findById(roleId);
        if (!role) {
            res.status(400).json({
                status: 'error',
                message: 'Role not found',
            });
            return;
        }

        removedRoles.push(role);
    }

    // Remove the roles from the user or the removed list if the user doesn't have the role
    for (const role of removedRoles) {
        const index = user.roles.findIndex((r) => r._id.equals(role._id));
        if (index >= 0) {
            user.roles.splice(index, 1);
        } else {
            removedRoles.splice(removedRoles.indexOf(role), 1);
        }
    }

    await user.save();

    res.status(200).json({
        status: 'success',
        rolesRemoved: removedRoles.length,
        data: {
            user,
            removedRoles,
        },
    });
});

export { devLoginUser, loginUser, getAllUsers, updateUser, getPermissions, getUser, getSelf, giveRoles, removeRoles };
