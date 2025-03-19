import {AuthorizationContext, AuthorizationDecision, AuthorizationMetadata, Authorizer} from '@loopback/authorization';
import {Provider} from '@loopback/core';

export class RoleAuthorizer implements Provider<Authorizer> {
  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    context: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ) {
    // console.log('User Object:', context.principals[0]); // Check the FULL user object
    // console.log('Metadata allowedRoles:', metadata.allowedRoles); // Verify allowedRoles

    const user = context.principals[0];
    const allowedRoles = metadata.allowedRoles ?? [];

    // Handle missing user or role
    if (!user || !user.role) {
      console.log('Role missing in user object!');
      return AuthorizationDecision.DENY;
    }

    // Check role (case-sensitive!)
    if (allowedRoles.includes(user.role)) {
      return AuthorizationDecision.ALLOW;
    } else {
      console.log(`User role '${user.role}' not in allowed roles:`, allowedRoles);
      return AuthorizationDecision.DENY;
    }
  }
}
