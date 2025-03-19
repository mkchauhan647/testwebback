import {MethodDecoratorFactory} from '@loopback/core';

/**
 * Custom `@Authorize` decorator to specify required roles for an endpoint.
 * @param roles - Array of roles allowed to access the method.
 */
const AUTHORIZE_METADATA_KEY = 'authorizationProviders.roleAuthorizer';

export function authorize(...roles: string[]) {

  console.log("roles", roles)

  return MethodDecoratorFactory.createDecorator<string[]>(
    // 'custom-authorization.roles',
    AUTHORIZE_METADATA_KEY,
    roles
  );
}

// import {MetadataAccessor, MetadataInspector} from '@loopback/core';

// /**
//  * Define a metadata accessor to store role-based authorization metadata.
//  */
// export const AUTHORIZATION_METADATA_KEY = MetadataAccessor.create<string[], MethodDecorator>(
//   'custom-authorization.roles'
// );

// /**
//  * `@Authorize` decorator to define required roles for an endpoint.
//  */
// export function Authorize(...roles: string[]) {
//   console.log("roles", roles)
//   return function (target: Object, methodName: string | symbol) {
//     MetadataInspector.defineMetadata(AUTHORIZATION_METADATA_KEY, roles, target, methodName as string);
//   };
// }
