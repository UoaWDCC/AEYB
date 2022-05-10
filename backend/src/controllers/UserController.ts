import { Request, Response } from 'express';

/**
 * @desc 	Get all the users
 * @route 	GET /api/users/
 */
const getUsers = async (req: Request, res: Response) => {
    // Fetch users

    res.status(200).json({
        message: 'Nice work, you just made a GET request!',
    });
};

export { getUsers };
