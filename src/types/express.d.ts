import { Request } from 'express';

export type TypedRequest<Q = unknown, B = unknown, P = unknown> = Request<P, any, B, Q>;
