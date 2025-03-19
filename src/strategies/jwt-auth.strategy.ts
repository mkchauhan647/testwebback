// import {AuthenticationStrategy, TokenService} from '@loopback/authentication';
// import {TokenServiceBindings} from '@loopback/authentication-jwt';
// import {inject} from '@loopback/core';
// import {HttpErrors, Request} from '@loopback/rest';
// import {UserProfile, securityId} from '@loopback/security';

// export class JWTAuthenticationStrategy implements AuthenticationStrategy {
//   name = 'jwt';

//   constructor(
//     @inject(TokenServiceBindings.TOKEN_SERVICE)
//     public tokenService: TokenService

//   ) { }

//   async authenticate(request: Request): Promise<UserProfile | undefined> {
//     const token: string = this.extractCredentials(request);
//     const userProfile = await this.tokenService.verifyToken(token);
//     return {
//       [securityId]: userProfile.id,
//       email: userProfile.email,
//     };
//   }

//   extractCredentials(request: Request): string {
//     const authHeader = request.headers.authorization;
//     if (!authHeader) {
//       throw new HttpErrors.Unauthorized('Authorization header missing');
//     }

//     const parts = authHeader.split(' ');
//     if (parts.length !== 2 || parts[0] !== 'Bearer') {
//       throw new HttpErrors.Unauthorized('Invalid authorization header format');
//     }

//     return parts[1];
//   }
// }


import {AuthenticationStrategy} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {UserProfile, securityId} from '@loopback/security';
import {AuthService} from '../services/auth.service';

export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(@inject('services.AuthService') private authService: AuthService) { }

  async authenticate(request: Request): Promise<UserProfile | undefined> {
    const authHeader = request.headers.authorization;

    console.log('authHeader', authHeader);
    if (!authHeader) {
      throw new HttpErrors.Unauthorized('Authorization header is missing.');
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = await this.authService.verifyAccessToken(token);

      console.log('payload', payload);
      return {id: payload.id, email: payload.email, [securityId]: payload.id, role: payload.role};
    } catch (error) {
      throw new HttpErrors.Unauthorized('Invalid token.');
    }
  }
}
