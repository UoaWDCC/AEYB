import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Role, { RoleModel } from '../models/RoleModel';
import Group, { GroupModel } from '../models/GroupModel';
import { GroupIdParam } from '../types/RequestParams';
import { TypedRequest } from '../types/UtilTypes';

/**
 * @desc 	Get all the groups
 * @route 	GET /api/groups/
 */
const getAllGroups = asyncHandler(async (req: Request, res: Response) => {
    const groups = await Group.find();

    res.status(200).json({
        status: 'success',
        data: {
            groups,
        },
    });
});

/**
 * @desc 	Get a specific group
 * @route 	GET /api/groups/:groupId
 */
const getGroup = asyncHandler(async (req: Request<GroupIdParam>, res: Response) => {
    const group = await Group.findById(req.params.groupId);

    let roles = [Object];

    if (req.params.groupId == '62ba8ef3e5ba8885e2bffb41') {
        // Default group
        roles = await Role.find({ group: { $exists: false } });
    } else {
        // Group stored in DB
        roles = await Role.find({ group: req.params.groupId });
    }

    res.status(200).json({
        status: 'success',
        data: {
            group,
            roles,
        },
    });
});

/**
 * @desc 	Add a new group
 * @route 	POST /api/groups/
 */
const addGroup = asyncHandler(async (req: TypedRequest<GroupModel, GroupIdParam>, res: Response) => {
    const newGroup = await Group.create(req.body);

    await res.status(201).json({
        status: 'success',
        data: {
            group: newGroup,
        },
    });
});

/**
 * @desc 	Delete a specific group
 * @route 	DELETE /api/groups/:groupId
 */
const deleteGroup = asyncHandler(async (req: Request<GroupIdParam>, res: Response) => {
    // You cannot delete a group that is still linked to roles
    let roles = [Object];

    if (req.params.groupId == '62ba8ef3e5ba8885e2bffb41') {
        // Default group
        res.status(403).json({
            status: 'error',
            message: 'You cannot delete the default group',
        });
    } else {
        // Group stored in DB
        roles = await Role.find({ group: req.params.groupId });
    }

    if (roles.length > 0) {
        const roleNames = roles.map((r) => r.name);
        res.status(403).json({
            status: 'error',
            message: 'You cannot delete a group that is linked to roles',
            roleNames,
        });

        return;
    }

    // Delete the group
    await Group.findByIdAndDelete(req.params.groupId);

    res.status(200).json({
        status: 'success',
    });
});

/**
 * @desc 	Edit a specific Group
 * @route 	PATCH /api/group/:groupId
 */
const updateGroup = asyncHandler(async (req: TypedRequest<GroupModel, GroupIdParam>, res: Response) => {
    const role = await Group.findByIdAndUpdate(req.params.groupId, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        status: 'success',
        data: {
            role,
        },
    });
});

export { getAllGroups, getGroup, updateGroup, addGroup, deleteGroup };
