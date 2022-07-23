import asyncHandler from 'express-async-handler';
import { Request, Response } from 'express';
import Event, { EventModel } from '../models/EventModel';
import { EventIdParam } from '../types/RequestParams';
import { TypedRequest, TypedRequestBody } from '../types/UtilTypes';
import PaginationHandler from '../classes/PaginationHandler';
import { EventFilterQuery } from '../types/QueryTypes';

/**
 * @desc    Get all the events
 * @route   GET /api/events
 */
const getAllEvents = asyncHandler(
    new PaginationHandler<EventModel, EventFilterQuery>(Event)
        .pre((query, req) => {
            const filterHandlers: Record<string, (value: string) => void> = {
                before: (value) => (query = query.where({ time: { $lt: new Date(value) } })),
                after: (value) => (query = query.where({ time: { $gt: new Date(value) } })),
                time: (value) => (query = query.where('time').equals(new Date(value))),
                creator: (value) => (query = query.where('creator').equals(value)),
                location: (value) => (query = query.where('location', new RegExp(value, 'i'))),
                name: (value) => (query = query.where('name', new RegExp(value, 'i'))),
            };

            Object.entries(req.query)
                .filter(([query]) => filterHandlers[query])
                .forEach(([query, value]: [string, string]) => filterHandlers[query](value));

            if (!req.query.passed || req.query.passed !== 'true') {
                query = query.where('time').gte(Date.now()); // Only get events that haven't passed
            }

            return query;
        })
        .pre((query) => query.sort({ time: 'ascending' }))
        .post(async (events) => await Promise.all(events.map((event) => event.populate('creator')))).handler,
);

/**
 * @desc    Get a specific event
 * @route   GET /api/events/:eventId
 */
const getEvent = asyncHandler(async (req: Request<EventIdParam>, res: Response) => {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
        res.status(404).json({
            status: 'error',
            message: `There is no event with the id ${req.params.eventId}`,
        });
        return;
    }

    await event.populate('creator');
    res.status(200).json({
        status: 'success',
        data: {
            event,
        },
    });
});

/**
 * @desc    Add a new event
 * @route   POST /api/events/
 */
const addEvent = asyncHandler(async (req: TypedRequestBody<EventModel>, res: Response) => {
    const newEvent = await Event.create({ ...req.body, creator: req.body.requester });

    res.status(200).json({
        status: 'success',
        data: {
            event: newEvent,
        },
    });
});

/**
 * @desc    Delete a specific event
 * @route   DELETE /api/events/:eventId
 */
const deleteEvent = asyncHandler(async (req: Request<EventIdParam>, res: Response) => {
    const response = await Event.findByIdAndDelete(req.params.eventId);
    if (response) {
        res.status(204);
        return;
    }
    res.status(404).json({
        status: 'error',
        message: `There is no event with the id ${req.params.eventId}`,
    });
});

/**
 * @desc    Edit a specific event
 * @route   PATCH /api/events/:eventId
 */
const updateEvent = asyncHandler(async (req: TypedRequest<EventModel, EventIdParam>, res: Response) => {
    const event = await Event.findByIdAndUpdate(req.params.eventId, req.body, {
        new: true,
        runValidators: true,
    });

    if (!event) {
        res.status(404).json({
            status: 'error',
            message: `There is no event with the id ${req.params.eventId}`,
        });
        return;
    }

    res.status(200).json({
        status: 'success',
        data: {
            event,
        },
    });
});

export { getAllEvents, getEvent, addEvent, deleteEvent, updateEvent };
