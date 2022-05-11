import express, { Express } from 'express';
import UserRouter from '../routes/UserRoutes';
import Config from '../types/Config';
import mongoose, { ConnectOptions } from 'mongoose';

export default class Server {
    private _app: Express;
    private config: Config;

    constructor(config: Config) {
        config.port = config.port ?? 5000; // Default to port 5000 if not specified
        this.config = config;
        this._app = express();

        this._app.listen(this.config.port, () =>
            console.log(`Server started on port ${this.config.port}`),
        );

        this.init();
    }

    private init(): Server {
        // Make sure the db is connected before registering routes
        this.connectDB().then(() => this.configureApp());
        return this;
    }

    private async connectDB() {
        // Connect to MonboDB database
        mongoose
            .connect(this.config.mongoURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            } as ConnectOptions)
            .then(() => {
                console.log('Connected to the Mongodb database.');
            });
    }

    private configureApp() {
        // Allow express to access the body of requests
        this._app.use(express.json());
        this._app.use(express.urlencoded({ extended: false }));

        this._app.use('/api/users', UserRouter);
        console.log('Routers registered');
    }

    public get app(): Express {
        return this._app;
    }
}