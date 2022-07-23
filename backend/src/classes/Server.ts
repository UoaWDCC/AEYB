import express, { Express } from 'express';
import UserRouter from '../routes/UserRoutes';
import RoleRouter from '../routes/RoleRoutes';
import PermissionRouter from '../routes/PermissionRoutes';
import { Config } from '../types/Config';
import mongoose from 'mongoose';
import ErrorHandler from '../middleware/ErrorMiddleware';
import EventRouter from '../routes/EventRoutes';

export default class Server {
    private _app: Express;
    private config: Config;

    constructor(config: Config) {
        this.config = config;
        this._app = express();

        this._app.listen(this.config.port, () => console.log(`Server started on port ${this.config.port}`));

        this.init();
    }

    private init(): Server {
        // Make sure the db is connected before registering routes
        this.connectDB().then(() => this.configureApp());
        return this;
    }

    private async connectDB() {
        // Connect to MongoDB database
        mongoose.connect(this.config.mongoURI).then(() => {
            console.log('Connected to the Mongodb database.');
        });
    }

    private configureApp() {
        // Allow express to access the body of requests
        this._app.use(express.json());
        this._app.use(express.urlencoded({ extended: false }));

        this._app.use('/api/users', UserRouter);
        this._app.use('/api/roles', RoleRouter);
        this._app.use('/api/permissions', PermissionRouter);
        this._app.use('/api/events', EventRouter);
        console.log('Routers registered');

        this._app.use(ErrorHandler); // Use error handler to catch any errors in routes
    }

    public get app(): Express {
        return this._app;
    }
}
