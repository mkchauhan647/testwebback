import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer
} from '@loopback/authorization';
import {Provider} from '@loopback/core';
import {UserProfile} from '@loopback/security';

// @injectable({tags: {key: AuthorizationTags.AUTHORIZER}})
export class RoleAuthorizerProvider implements Provider<Authorizer> {
  value(): Authorizer {
    return this.authorize.bind(this);
  }

  async authorize(
    context: AuthorizationContext,
    metadata?: AuthorizationMetadata,
  ): Promise<AuthorizationDecision> {

    // console.log("context", context)
    console.log("metadata", metadata)

    const user = context.principals[0] as UserProfile & {role: string};
    const userRole = user.role;


    // console.log("user", user)
    // console.log("userRole", userRole)

    //  required roles from @authorize decorator
    const requiredRoles = metadata?.allowedRoles ?? [];

    // Authorization logic
    if (!requiredRoles.length) {
      return AuthorizationDecision.ALLOW;
    }

    if (!userRole) {
      return AuthorizationDecision.DENY;
    }

    const isAllowed = requiredRoles.includes(userRole);
    return isAllowed ? AuthorizationDecision.ALLOW : AuthorizationDecision.DENY;
  }
}
