import {AuthenticateFn, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  FindRoute,
  InvokeMethod,
  ParseParams,
  Reject,
  RequestContext,
  RestBindings,
  Send,
  SequenceHandler,
} from '@loopback/rest';
import multer from 'multer';



const storage = multer.memoryStorage();
const upload = multer({storage});

export class MySequence implements SequenceHandler {
  constructor(
    @inject(RestBindings.SequenceActions.FIND_ROUTE)
    protected findRoute: FindRoute,
    @inject(RestBindings.SequenceActions.PARSE_PARAMS)
    protected parseParams: ParseParams,
    @inject(RestBindings.SequenceActions.INVOKE_METHOD)
    protected invoke: InvokeMethod,
    @inject(RestBindings.SequenceActions.SEND)
    protected send: Send,
    @inject(RestBindings.SequenceActions.REJECT)
    protected reject: Reject,
    // @inject('rest.middleware') protected middleware: any,
    // @inject('rest.middleware.invokeMiddleware') protected invokeMiddleware: any,
    @inject(RestBindings.SequenceActions.INVOKE_MIDDLEWARE)
    protected invokeMiddleware: (context: RequestContext) => Promise<boolean>,
    @inject(AuthenticationBindings.AUTH_ACTION)
    protected authenticateRequest: AuthenticateFn
  ) { }

  async handle(context: RequestContext) {
    const {request, response} = context;
    try {
      const route = this.findRoute(request);

      console.log("route", route.path);

      // // Apply multer middleware only to specific route
      // if (route.path === '/table-metadata/') {
      //   await this.applyMulterMiddleware(request, response);

      // }

      const user = await this.authenticateRequest(context.request);
      console.log('Authenticated user:', user);

      if (

        this.routeCheckerforMultiUpload(route.path) &&
        (request.method === 'POST' || request.method === 'PATCH')
      ) {
        console.log("I am running?")
        await this.applyMulterMiddleware(request, response, true);
      }
      else {
        // check if contentType is multipart/form-data
        const contentType = request.headers['content-type'] || request.headers['Content-Type'];
        if (typeof contentType === 'string' && contentType.startsWith('multipart/form-data')) {
          console.log("contentType", contentType);
          await this.applyMulterMiddleware(request, response);
        }

      }

      // if (process.env.NODE_ENV !== 'production') {
      const finished = await this.invokeMiddleware(context);
      if (finished) return;
      // }


      // Proceed with normal request handling
      const args = await this.parseParams(request, route);
      // console.log("args", args);

      const result = await this.invoke(route, args);

      // console.log("result", result);
      // console.log("args", args);

      this.send(response, result);
    } catch (err) {
      console.error('Error handling request:', err);
      this.reject(context, err);
    }
  }


  private routeCheckerforMultiUpload(route: string) {
    const multerRoutes = [
      '/table-metadata',
      '/footers',
    ];

    return multerRoutes.some(multerRoute => route.startsWith(multerRoute));
  }




  private async applyMulterMiddleware(request: any, response: any, isMulti: boolean = false) {
    if (isMulti) {
      return new Promise<void>((resolve, reject) => {
        upload.any()(request, response, (err: unknown) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    } else {
      return new Promise<void>((resolve, reject) => {
        upload.single('file')(request, response, (err: unknown) => {


          // console.log("err", err);
          console.log("request.file", request.file);
          console.log("req", request.body);

          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
    }
  }

}
