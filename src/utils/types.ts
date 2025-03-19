export type AuthTokenResponse = {
  accessToken: string,
  refreshToken: string,
  expiresIn: string,
}

export enum RoleType {
  USER = 'user',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin',
}

import {RequestHandler} from 'express-serve-static-core';

export type FileUploadHandler = RequestHandler;
