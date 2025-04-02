// import {
//   /* inject, */
//   globalInterceptor,
//   Interceptor,
//   InvocationContext,
//   InvocationResult,
//   Provider,
//   ValueOrPromise,
// } from '@loopback/core';
// import {ExpressRequestHandler, toInterceptor} from '@loopback/rest';
// import multer from 'multer';

// const storage = multer.memoryStorage();
// const upload = multer({storage});


// /**
//  * This class will be bound to the application as an `Interceptor` during
//  * `boot`
//  */
// @globalInterceptor('', {tags: {name: 'fileuploadinterceptor'}})
// export class FileuploadinterceptorInterceptor implements Provider<Interceptor> {
//   /*
//   constructor() {}
//   */

//   /**
//    * This method is used by LoopBack context to produce an interceptor function
//    * for the binding.
//    *
//    * @returns An interceptor function
//    */
//   value() {
//     // return this.intercept.bind(this);
//     // const handler: ExpressRequestHandler = upload.single('file');
//     const handler: ExpressRequestHandler = upload.any();
//     return toInterceptor(handler);
//   }

//   /**
//    * The logic to intercept an invocation
//    * @param invocationCtx - Invocation context
//    * @param next - A function to invoke next interceptor or the target method
//    */
//   async intercept(
//     invocationCtx: InvocationContext,
//     next: () => ValueOrPromise<InvocationResult>,
//   ) {
//     try {
//       // Add pre-invocation logic here
//       const result = await next();
//       // Add post-invocation logic here
//       return result;
//     } catch (err) {
//       // Add error handling logic here
//       throw err;
//     }
//   }
// }

import {
  globalInterceptor,
  Interceptor,
  Provider,
} from '@loopback/core';
import {ExpressRequestHandler, toInterceptor} from '@loopback/rest';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({storage});

@globalInterceptor('', {tags: {name: 'fileuploadinterceptor'}})
export class FileuploadinterceptorInterceptor implements Provider<Interceptor> {
  value() {
    // Use 'single()' for a single file or 'any()' for multiple files
    const handler: ExpressRequestHandler = upload.any();
    return toInterceptor(handler);
  }
}
