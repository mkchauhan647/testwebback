import {UserRepository} from '@loopback/authentication-jwt';
import {inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {compare, hash} from 'bcryptjs';
import dotenv from 'dotenv';
import * as jwt from 'jsonwebtoken';
import {User} from '../models';
import {AuthRepository} from '../repositories';

dotenv.config();

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'secretKey';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refreshSecret';
const ACCESS_TOKEN_EXPIRY = '1d';
const REFRESH_TOKEN_EXPIRY = '7d';
// const ACCESS_TOKEN_EXPIRY: number | string = process.env.ACCESS_TOKEN_EXPIRY ?? '900s'; // 15 minutes
// const REFRESH_TOKEN_EXPIRY: number | string = process.env.REFRESH_TOKEN_EXPIRY ?? '7d'; // 7 days




@injectable()
export class AuthService {
  constructor(
    @repository(AuthRepository) public authUserRepo: AuthRepository,
    @repository(UserRepository) public userRepo: UserRepository,
    @inject(SecurityBindings.USER, {optional: true})
    private currentUser?: UserProfile,
  ) { }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  // Compare password
  async comparePassword(providedPass: string, storedPass: string): Promise<boolean> {
    return compare(providedPass, storedPass);
  }

  // Generate access token
  async generateAccessToken(user: User): Promise<string> {

    // const options: jwt.SignOptions = {
    //   expiresIn: ACCESS_TOKEN_EXPIRY
    // }

    return jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user?.tenantId,
    }, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    })


  }

  // Generate refresh token
  async generateRefreshToken(user: User): Promise<string> {
    // return signAsync({id: user.id}, REFRESH_TOKEN_SECRET as string, {
    //   expiresIn: REFRESH_TOKEN_EXPIRY,
    // });
    return jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user?.tenantId,
    }, REFRESH_TOKEN_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    })
  }

  // Verify access token
  async verifyAccessToken(token: string): Promise<any> {
    // return verifyAsync(token, ACCESS_TOKEN_SECRET);
    return jwt.verify(token, ACCESS_TOKEN_SECRET);
  }

  // Verify refresh token
  async verifyRefreshToken(token: string): Promise<any> {
    // return verifyAsync(token, REFRESH_TOKEN_SECRET);
    return jwt.verify(token, REFRESH_TOKEN_SECRET);
  }



  async getTenantId(): Promise<string | null> {
    if (this.currentUser && this.currentUser.tenantId) {
      return this.currentUser.tenantId;
    }

    if (this.currentUser?.id) {
      const user = await this.userRepo.findById(this.currentUser.id);
      return user.tenantId || null;
    }

    return null;
  }

}
