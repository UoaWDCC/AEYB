import { Response } from 'express';
import { Doc, TypedQuery, TypedRequestQuery } from './UtilTypes';

export interface PaginationOptions {
    limit: number;
    page: number;
}

export interface PaginationConfig {
    maxLimit: number;
    defaultLimit: number;
    minLimit: number;
    defaultPage: number;
}

export type PreCallback<T, TQuery> = (
    query: TypedQuery<T>,
    req: TypedRequestQuery<TQuery>,
    res: Response,
) => TypedQuery<T> | void;

export type PostCallback<T> = (results: Doc<T>[], options: PaginationOptions) => Promise<Doc<T>[]> | Doc<T>[];
