import { Response } from 'express';
import { Model } from 'mongoose';
import { PreCallback, PaginationOptions, PostCallback, PaginationConfig } from '../types/PaginationTypes';
import { PaginationQuery } from '../types/QueryTypes';
import { Doc, TypedRequestQuery } from '../types/UtilTypes';

/**
 * The `PaginationHandler` manages the number of results (`limit` query) and the page (`page` query) automatically. It is a
 * zero-based paging system, hence the first page is page 0. Additionally, it's possible to run functions before the
 * pagination using the pre-callbacks to modify the query being paginated. This is particularly useful if you want to filter
 * results by some condition before paginating the results.
 *
 * Examples:
 *
 * - Default pagination handler:
 * ```ts
 * const getAllEvents = asyncHandler(new PaginationHandler(Event).handler);
 * ```
 *
 * - Customing default number of results:
 * ```ts
 * const getAllEvents = asyncHandler(new PaginationHandler(Event, { limit: 10 }).handler);
 * ```
 *
 * - Using pre-callbacks to sort events by ascending order:
 * ```ts
 * const getAllEvents = asyncHandler(new PaginationHandler(Event).pre((query) => query.sort({ time: 'ascending' })).handler);
 * ```
 * @see PaginationHandler.pre
 */
export default class PaginationHandler<T, TQuery extends PaginationQuery = PaginationQuery> {
    private readonly model: Model<T>;
    private readonly dataName: string;
    private readonly options: PaginationConfig;

    private preCallbacks: PreCallback<T, TQuery>[] = [];
    private postCallbacks: PostCallback<T>[] = [];

    /**
     * Constructs a `PaginationHandler` for the specified model. Unless you override them, the default pagination options
     * are: `maxLimit=Number.MAX_SAFE_INTEGER`, `defaultLimit=30`, `minLimit=1` and `defaultPage=0`. Note that the `defaultLimit`
     * will automatically adjust to fit within the bounds of `minLimit` and `maxLimit`.
     *
     * @param model The mongoose model that will be paginated
     * @param options The pagination config that should be used.
     */
    constructor(model: Model<T>, options: Partial<PaginationConfig> = {}) {
        this.model = model;

        // The name of the field that should be used when the results are returned in the response
        this.dataName = model.modelName.toLowerCase() + 's';

        const maxLimit = options.maxLimit ?? Number.MAX_SAFE_INTEGER;
        const minLimit = options.minLimit ?? 1;
        if (maxLimit < minLimit) throw new Error('The max limit cannot be less than the min limit');

        if (options.defaultLimit && (options.defaultLimit < minLimit || options.defaultLimit > maxLimit))
            throw new Error(`The default limit is not within the specified bounds of ${minLimit} to ${maxLimit}`);

        // Make sure the defaultLimit is within the bounds of the minLimit and maxLimit
        const defaultLimit = options.defaultLimit ?? Math.min(Math.max(30, minLimit), maxLimit);
        this.options = {
            maxLimit: maxLimit,
            defaultLimit: defaultLimit,
            minLimit: minLimit,
            defaultPage: options.defaultPage ?? 0,
        };

        // When the handler function is used as a parameter, 'this' becomes undefined. Binding the value of 'this' to this
        // instance prevents that from occuring. See: https://www.w3schools.com/js/js_function_bind.asp
        this.handler = this.handler.bind(this);
    }

    /**
     * Adds another pre-callback to the list. Pre-callbacks are run in order before the pagination begins and allow for you to
     * modify the query to add filtering or sorting. Pre-callbacks can take up to 3 parameters:
     * ```ts
     * function (query: TypedQuery<EventModel>, req: TypedRequestQuery<PaginationQuery>, res: Response);
     * ```
     * If your pre-callback needs to cancel the pagination, for example if an invalid request is found, then you can return
     *  `void`. Do note, this means responding to the request becomes your responsibility:
     * ```ts
     * const getAllEvents = asyncHandler(
     *      new PaginationHandler(Event).pre((query, req, res) => {
     *          res.status(400).json({ status: 'error', message: 'Nothing is being accepted today >:)' });
     *      }).handler,
     * );
     * ```
     *
     * If your endpoint has custom query parameters (E.g: for filtering), you'll need to specify the type when creating the
     * `PaginationHandler`. **Note:** This type must extend `PaginationQuery`.
     * ```ts
     * interface FilterQuery extends PaginationQuery {
     *      name?: string;
     * }
     *
     * const getAllEvents = asyncHandler(
     *      new PaginationHandler<EventModel, FilterQuery>(Event).pre((query, req) => handleFilters(query, req)).handler,
     * );
     * ```
     *
     * Alternatively, if you're not using an arrow function, the types can be excluded from `PaginationHandler`:
     * ```ts
     * interface FilterQuery extends PaginationQuery {
     *      name?: string;
     * }
     *
     * function handleFilters(query: TypedQuery<EventModel>, req: TypedRequestQuery<FilterQuery>): TypedQuery<EventModel> {
     *      // Handle the filtering...
     *      return query;
     * }
     *
     * const getAllEvents = asyncHandler(new PaginationHandler(Event).pre(handleFilters).handler);
     * ```
     *
     * @param fn The pre-callback to add
     * @returns Itself for chaining
     */
    public pre(fn: PreCallback<T, TQuery>): this {
        this.preCallbacks.push(fn);
        return this;
    }

    /**
     * Adds another post-callback to the list. Post-callbacks are run in order after the paginated results have been fetched.
     * Post-callbacks can take up to 2 parameters and should return the results that will be used in the response.
     * ```ts
     * async function (results: Doc<T>[], options: PaginationOptions) => Promise<Doc<T>[]>;
     * ```
     *
     * @param fn The post-callback to add
     * @returns Itself for chaining
     */
    public post(fn: PostCallback<T>): this {
        this.postCallbacks.push(fn);
        return this;
    }

    /**
     * Parses the `limit` and `page` to use for pagination and ensures that they are valid. If no `limit` or `page` was
     * specified in the query then their default values are used.
     *
     * @param req The request
     * @param res The response
     * @returns Either the parsed `PaginationOptions` or `void` if the request was invalid
     */
    private handlePagination(req: TypedRequestQuery<TQuery>, res: Response): PaginationOptions | void {
        let limit = this.options.defaultLimit;
        let page = this.options.defaultPage;

        if (req.query.limit) {
            const parsedLimit = parseInt(req.query.limit);
            if (isNaN(parsedLimit)) {
                res.status(400).json({
                    status: 'error',
                    message: `Expected the limit parameter to be an integer (Got ${req.query.limit})`,
                });
                return;
            }
            if (parsedLimit < this.options.minLimit) {
                res.status(400).json({
                    status: 'error',
                    message: `Expected the limit parameter to be greater than or equal to ${this.options.minLimit} (Got ${parsedLimit})`,
                });
                return;
            }
            if (parsedLimit > this.options.maxLimit) {
                res.status(400).json({
                    status: 'error',
                    message: `Expected the limit parameter to be less than or equal to ${this.options.maxLimit} (Got ${parsedLimit})`,
                });
                return;
            }
            limit = parsedLimit;
        }

        if (req.query.page) {
            const parsedPage = parseInt(req.query.page);
            if (isNaN(parsedPage)) {
                res.status(400).json({
                    status: 'error',
                    message: `Expected the page parameter to be an integer (Got ${req.query.page})`,
                });
                return;
            }
            if (parsedPage < 0) {
                res.status(400).json({
                    status: 'error',
                    message: `Expected the page parameter to be positive (Got ${req.query.page})`,
                });
                return;
            }
            page = parsedPage;
        }

        return { limit, page };
    }

    /**
     * A helper method used to create the pagination response.
     *
     * @param res The response
     * @param results The paginated data to return
     * @param hasNext If there is a page after the current one
     * @param hasPrev If there is a page before the current one
     * @param totalPages The total number of pages
     * @param totalResults The total number of results across all pages
     * @param options The pagination options used
     */
    private createResponse(
        res: Response,
        results: Doc<T>[],
        hasNext: boolean,
        hasPrev: boolean,
        totalPages: number,
        totalResults: number,
        options: PaginationOptions,
    ) {
        res.status(200).json({
            status: 'success',
            hasNext,
            hasPrev,
            totalPages,
            page: options.page,
            limit: options.limit,
            results: results.length,
            totalResults,
            data: {
                [this.dataName]: results,
            },
        });
    }

    /**
     * The handler is the entry point that enables the `PaginationHandler` to automatically handle the pagination of the
     * query. It can either be passed directly to the `asyncHandler` or it can be called indirectly with the request and
     * response parameters.
     *
     * @param req The request
     * @param res The response
     */
    public async handler(req: TypedRequestQuery<TQuery>, res: Response) {
        const options = this.handlePagination(req, res);
        if (!options) return;

        let query = this.model.find<Doc<T>>();
        for (let i = 0; i < this.preCallbacks.length; i++) {
            const callback = this.preCallbacks[i];
            const tempQuery = callback(query, req, res);
            if (tempQuery) query = tempQuery;
            else return;
        }

        const documentCount = await query.countDocuments();
        if (documentCount === 0) {
            this.createResponse(res, [], false, false, 0, 0, options);
            return;
        }

        const totalPages = Math.ceil(documentCount / options.limit);
        if (options.page >= totalPages) {
            res.status(400).json({
                status: 'error',
                message: `The page parameter ${options.page} is out of bounds. (Max page is ${totalPages - 1})`,
            });
            return;
        }

        let results = await this.model
            .find<Doc<T>>()
            .merge(query)
            .limit(options.limit)
            .skip(options.page * options.limit);

        for (let i = 0; i < this.postCallbacks.length; i++) {
            const callback = this.postCallbacks[i];
            results = await callback(results, options);
        }

        const hasNext = options.page < totalPages - 1;
        const hasPrev = options.page !== 0;

        this.createResponse(res, results, hasNext, hasPrev, totalPages, documentCount, options);
    }
}
