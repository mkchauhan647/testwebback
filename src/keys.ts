import {Authorizer} from '@loopback/authorization';
import {BindingKey} from '@loopback/core';

export namespace CustomAuthorizationBindings {
  export const AUTHORIZER = BindingKey.create<Authorizer>('authorization.customAuthorizer');
}


export const FILE_UPLOAD_SERVICE = BindingKey.create<string>(
  "service.file-upload"
);

export const STORAGE_LOCATION = BindingKey.create<string>(
  "storage.location"
);

