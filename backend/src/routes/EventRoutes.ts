import { Router } from 'express';
import { addEvent, deleteEvent, getAllEvents, getEvent, updateEvent } from '../controllers/EventController';
import protect from '../middleware/AuthMiddleware';

const EventRouter = Router();

EventRouter.route('/').get(protect(), getAllEvents).post(protect(), addEvent);
EventRouter.route('/:eventId').get(protect(), getEvent).delete(protect(), deleteEvent).patch(protect(), updateEvent);

export default EventRouter;
