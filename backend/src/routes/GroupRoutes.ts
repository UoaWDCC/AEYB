import { Router } from 'express';
import protect from '../middleware/AuthMiddleware';
import Permission from '../types/Perm';

import { getAllGroups, getGroup, addGroup, updateGroup, deleteGroup } from '../controllers/GroupController';

const GroupRouter = Router();

GroupRouter.route('/').get(protect(Permission.VIEW_GROUPS), getAllGroups).post(protect(Permission.ADD_GROUP), addGroup);
GroupRouter.route('/:groupId')
    .get(protect(Permission.VIEW_GROUPS), getGroup)
    .delete(protect(Permission.DELETE_GROUP), deleteGroup)
    .patch(protect(Permission.UPDATE_GROUP), updateGroup);

export default GroupRouter;
