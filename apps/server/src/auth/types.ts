import type { Static } from '@sinclair/typebox';
import type { RouteGenericInterface } from 'fastify';
import type {
  RefreshTokenRequest,
  RequestLoginCodeRequest,
  VerifyLoginCodeRequest,
} from '@label-log/contracts';

import {
  EmailBodySchema,
  RefreshBodySchema,
  VerifyBodySchema,
} from './schemas.js';

export type EmailBody = Static<typeof EmailBodySchema>;
export type VerifyBody = Static<typeof VerifyBodySchema>;
export type RefreshBody = Static<typeof RefreshBodySchema>;

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;
export type _RequestLoginContractMatches = Assert<
  Equal<EmailBody, RequestLoginCodeRequest>
>;
export type _VerifyLoginContractMatches = Assert<
  Equal<VerifyBody, VerifyLoginCodeRequest>
>;
export type _RefreshContractMatches = Assert<
  Equal<RefreshBody, RefreshTokenRequest>
>;

export interface RequestLoginCodeRoute extends RouteGenericInterface {
  Body: EmailBody;
}

export interface VerifyLoginCodeRoute extends RouteGenericInterface {
  Body: VerifyBody;
}

export interface RefreshTokenRoute extends RouteGenericInterface {
  Body: RefreshBody;
}
