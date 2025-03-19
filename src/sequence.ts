import {MiddlewareSequence, RequestContext} from '@loopback/rest';

export class MySequence extends MiddlewareSequence {


  async handle(context: RequestContext): Promise<void> {

    // this.invokeMiddleware

    // Add your pre-processing logic here
    // console.log('Request is:', context.request);
    await super.handle(context);
    // Add your post-processing logic here
    // console.log('Response is:', context.response);
  }


}
