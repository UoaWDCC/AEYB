import mongoose, { Query } from 'mongoose';
import { UserModel } from '../models/UserModel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Doc<T> = mongoose.Document<unknown, any, T> &
    T & {
        _id: string;
    };

export type QueryType<T> = Query<Doc<T>[], Doc<T>>;

export interface TypedRequest<BodyType, ParamsType> extends Express.Request {
    body: BodyType & { requester: Doc<UserModel> };
    params: ParamsType;
}

export interface TypedRequestBody<Type> extends TypedRequest<Type, unknown> {}

export interface TypedRequestParams<Type> extends TypedRequest<unknown, Type> {}

export interface AuthenticatedRequest extends TypedRequest<unknown, unknown> {}
