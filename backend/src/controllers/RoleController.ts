import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Role, { RoleModel } from '../models/RoleModel';
import User from '../models/UserModel';
import { RoleIdParam } from '../types/RequestParams';
import { TypedRequest, TypedRequestBody } from '../types/UtilTypes';

/**
 * @desc 	Get all the roles
 * @route 	GET /api/roles/
 */
const getAllRoles = asyncHandler(async (req: Request, res: Response) => {
    const roles = await Role.find();

    res.status(200).json({
        status: 'success',
        results: roles.length,
        data: {
            roles,
        },
    });
});

/**
 * @desc 	Get a specific role
 * @route 	GET /api/roles/:roleId
 */
const getRole = asyncHandler(async (req: Request<RoleIdParam>, res: Response) => {
    const role = await Role.findById(req.params.roleId);
    if (!role) {
        res.status(404).json({
            status: 'error',
            message: `There is no role with the id ${req.params.roleId}`,
        });
        return;
    }

    const userCount = await User.countDocuments({ roles: req.params.roleId });

    res.status(200).json({
        status: 'success',
        userCount,
        data: {
            role,
        },
    });
});

/**
 * @desc 	Add a new role
 * @route 	POST /api/roles/
 */
const addRole = asyncHandler(async (req: TypedRequestBody<RoleModel>, res: Response) => {
    const newRole = await Role.create(req.body);

    await res.status(201).json({
        status: 'success',
        data: {
            role: newRole,
        },
    });
});

/**
 * @desc 	Delete a specific role
 * @route 	DELETE /api/roles/:roleId
 */
const deleteRole = asyncHandler(async (req: Request<RoleIdParam>, res: Response) => {
    // Remove the role from any users that had it
    let modCount = 0;
    await User.updateMany({ roles: req.params.roleId }, { $pull: { roles: req.params.roleId } }, { new: true }).then(
        (users) => {
            modCount = users.modifiedCount;
        },
    );

    // Delete the role
    await Role.findByIdAndDelete(req.params.roleId);

    res.status(200).json({
        status: 'success',
        modifiedUserCount: modCount,
    });
});

/**
 * @desc 	Edit a specific role
 * @route 	PATCH /api/roles/:roleId
 */
const updateRole = asyncHandler(async (req: TypedRequest<RoleModel, RoleIdParam>, res: Response) => {
    const role = await Role.findByIdAndUpdate(req.params.roleId, req.body, {
        new: true,
        runValidators: true,
    });

    if (!role) {
        res.status(404).json({
            status: 'error',
            message: `There is no role with the id ${req.params.roleId}`,
        });
        return;
    }

    res.status(200).json({
        status: 'success',
        data: {
            role,
        },
    });
});

export { getAllRoles, getRole, deleteRole, addRole, updateRole };
