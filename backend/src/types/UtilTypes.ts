import mongoose, { Query } from 'mongoose';
import { UserModel } from '../models/UserModel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc<T> = mongoose.Document<unknown, any, T> &
    T & {
        _id: string;
    };

export type TypedQuery<T> = Query<Doc<T>[], Doc<T>>;

export interface TypedRequest<BodyType, ParamsType, QueryType = unknown> extends Express.Request {
    body: BodyType & { requester: Doc<UserModel> };
    params: ParamsType;
    query: QueryType;
}

export interface TypedRequestBody<Type> extends TypedRequest<Type, unknown> {}

export interface TypedRequestParams<Type> extends TypedRequest<unknown, Type> {}

export interface TypedRequestQuery<Type> extends TypedRequest<unknown, unknown, Type> {}

export interface AuthenticatedRequest extends TypedRequest<unknown, unknown> {}
