import {AuthenticationBindings} from '@loopback/authentication';
import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import {User} from '../models';
import {UserRepository} from '../repositories';
import {RoleType} from '../utils/types';

@injectable({scope: BindingScope.TRANSIENT})
export class UserService {
  constructor(
    @inject(AuthenticationBindings.CURRENT_USER) private readonly user: User,

    @repository(UserRepository) private userRepo: UserRepository) { }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepo.findById(+userId);
    if (!user) throw new HttpErrors.NotFound('User not found');
    return user;
  }

  async isCustomer(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user.role === 'user';
  }

  async isVendor(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user.role === 'admin';
  }

  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user.role === 'admin';
  }

  async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserById(userId);
    return user.role === 'superadmin';
  }

  async assignRole(userId: string, role: string): Promise<void> {
    let roleType = role as RoleType;
    if (RoleType.ADMIN !== role && RoleType.SUPERADMIN !== role) {
      // throw new HttpErrors.Unauthorized('You are not authorized to perform this action');
      roleType = RoleType.USER;
    }
    else if (RoleType.ADMIN === role) {
      // if(!await this.isAdmin(userId)) {
      //   throw new HttpErrors.Unauthorized('You are not authorized to perform this action');
      // }
      roleType = RoleType.ADMIN;
    }
    else if (RoleType.SUPERADMIN === role) {
      // if(!await this.isSuperAdmin(userId)) {
      //   throw new HttpErrors.Unauthorized('You are not authorized to perform this action');
      // }
      roleType = RoleType.SUPERADMIN;
    }
    await this.userRepo.updateById(+userId, {role: roleType});
  }
}
