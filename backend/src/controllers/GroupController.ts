import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
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

    //TODO return roles and users that link to group

    res.status(200).json({
        status: 'success',
        data: {
            group,
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
    // TODO You cannot delete a group that is still linked to roles

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
