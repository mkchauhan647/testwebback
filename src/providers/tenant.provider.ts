// src/middleware/tenant.middleware.ts
import {Provider} from '@loopback/core';
import {Middleware, Request, RestBindings} from '@loopback/rest';
import {allowedPaths} from '../utils/helpers';

export class TenantMiddlewareProvider implements Provider<Middleware> {
  value(): Middleware {
    return async (ctx, next) => {
      const req: Request = await ctx.get(RestBindings.Http.REQUEST);

      // console.log("req.headers", req.headers)

      const path = req.path;
      console.log("path", path)
      if (path in allowedPaths) {
        return next();
      }


      let tenantId = Number(req.headers['x-tenant-id']);
      if (!tenantId) {
        // throw new Error('Tenant ID is required');
        tenantId = 1;
      }
      ctx.bind('tenantId').to(tenantId);
      return next();
    };
  }
}
