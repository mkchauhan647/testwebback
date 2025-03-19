// import {
//   globalInterceptor,
//   Interceptor,
//   InvocationResult,
//   InvocationContext as LoopbackInvocationContext,
//   Provider,
//   ValueOrPromise,
// } from '@loopback/core';
// import {HttpErrors} from '@loopback/rest';

// interface InvocationContext extends LoopbackInvocationContext {
//   options?: {
//     currentUser?: {
//       role?: string;
//     };
//   };
// }

// @globalInterceptor('', {tags: {name: 'AuthorizationInterceptor'}})
// export class AuthorizationInterceptor implements Provider<Interceptor> {
//   value(): Interceptor {
//     return async (
//       invocationCtx: InvocationContext,
//       // roles: string[],
//       next: () => ValueOrPromise<InvocationResult>,
//     ) => {
//       console.log('🔒 AuthorizationInterceptor invoked', invocationCtx);
//       console.log('🔒 AuthorizationInterceptor invoked', invocationCtx.methodName);
//       console.log('🔒 AuthorizationInterceptor invoked', invocationCtx.getValueOrPromise('authorizationProviders.roleAuthorizer'));

//       // const requiredRoles: string[] = Reflect.getMetadata('custom-authorization.roles', invocationCtx.targetName, invocationCtx.methodName) || [];
//       // 🔹 Retrieve required roles from the method's metadata
//       const requiredRoles: string[] = invocationCtx.methodName.split('')
//       // ?.['custom-authorization.roles'];
//       console.log('🔒 Required Roles:', requiredRoles);
//       if (!requiredRoles) {
//         return next();
//       }

//       const userRole = invocationCtx.options?.currentUser?.role || 'guest';


//       console.log(`🔒 Checking Authorization: User Role = ${userRole}, Required Roles = ${requiredRoles}`);

//       if (!requiredRoles.includes(userRole)) {
//         throw new HttpErrors.Forbidden('🚫 You do not have permission to access this resource.');
//       }

//       return next();
//     };
//   }
// }

// // import {
// //   globalInterceptor,
// //   Interceptor,
// //   InvocationResult,
// //   InvocationContext as LoopbackInvocationContext,
// //   MetadataInspector,
// //   Provider,
// //   ValueOrPromise
// // } from '@loopback/core';
// // import {HttpErrors} from '@loopback/rest';
// // import {AUTHORIZATION_METADATA_KEY} from '../decorators/authorization.decorator';

// // interface InvocationContext extends LoopbackInvocationContext {
// //   options?: {
// //     currentUser?: {
// //       role?: string;
// //     };
// //   };
// // }

// // @globalInterceptor('', {tags: {name: 'AuthorizationInterceptor'}})
// // export class AuthorizationInterceptor implements Provider<Interceptor> {
// //   value(): Interceptor {
// //     return async (
// //       invocationCtx: InvocationContext,
// //       next: () => ValueOrPromise<InvocationResult>,
// //     ) => {
// //       // Retrieve required roles from metadata
// //       console.log("target", invocationCtx.target)
// //       console.log("methodName", invocationCtx.methodName)
// //       // console.log("data",invocationCtx)
// //       const requiredRoles: string[] = MetadataInspector.getMethodMetadata(
// //         AUTHORIZATION_METADATA_KEY,
// //         invocationCtx.target,
// //         invocationCtx.methodName
// //       ) || [];

// //       console.log('🔒 Required Roles:', requiredRoles);

// //       if (requiredRoles.length === 0) {
// //         return next(); // No restriction, allow request
// //       }

// //       // Simulating user role retrieval (Replace this with actual authentication logic)
// //       const userRole = invocationCtx.options?.currentUser?.role || 'guest';

// //       console.log(`🔒 Checking Authorization: User Role = ${userRole}, Required Roles = ${requiredRoles}`);

// //       if (!requiredRoles.includes(userRole)) {
// //         throw new HttpErrors.Forbidden('🚫 You do not have permission to access this resource.');
// //       }

// //       return next();
// //     };
// //   }
// // }
