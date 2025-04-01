import {authenticate} from '@loopback/authentication';
import {authorize} from '@loopback/authorization';
import {inject, intercept} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  patch,
  post,
  put,
  requestBody,
  response
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {compare, hash} from 'bcryptjs';
import {Auth, User} from '../models';
import {AuthRepository, RefreshTokenRepository, UserRepository} from '../repositories';
import {AuthService} from '../services';
import {RoleType} from '../utils/types';

export class AuthController {
  constructor(
    @repository(AuthRepository)
    public authRepository: AuthRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,

    @repository(RefreshTokenRepository)
    public refreshTokenRepository: RefreshTokenRepository,

    // @inject(UserServiceBindings.USER_SERVICE)
    // public userService: UserService<User, Credentials>,
    // @inject(TokenServiceBindings.TOKEN_SERVICE)
    // public jwtService: TokenService
    @inject('services.AuthService') public authService: AuthService,
  ) { }




  @authenticate('jwt')
  @intercept('authorizers.RoleAuthorizer')
  @authorize({allowedRoles: ['admin', 'superadmin']})
  @get('/protected')
  @response(200, {
    description: 'Protected Route',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'}
          }
        }
      }
    }
  })
  async protectedRoute(): Promise<{message: string}> {
    return {
      message: "Hello World"
    }
  }

  @post('/auth/login')
  @response(200, {
    description: 'Auth model instance',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            accessToken: {type: 'string'},
            refreshToken: {type: 'string'},
            expiresIn: {type: 'string'}
          }
        }
      }
    },
  })
  async login(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              email: {type: 'string'},
              password: {type: 'string'},
            },
            required: ['email', 'password']
          }
        }
      }
    })
    auth: {email: string, password: string, phone_number?: string}
  ): Promise<any | string> {

    const userExist = await this.userRepository.findOne({
      where: {
        email: auth.email
      }
    })

    if (!userExist) {
      return JSON.stringify({message: "User Doesn't Exist"})
    }

    const user_credential = await this.authRepository.findOne({
      where: {
        user_id: userExist.id
      }
    })

    const isValidPassword = await compare(auth.password, user_credential?.password || "");

    if (!isValidPassword) {
      // return JSON.stringify({
      //   message: "Wrong Credentials"
      // })
      throw new HttpErrors.Unauthorized("Wrong Credentials")
    }

    // const userProfile = this.userService.convertToUserProfile(userExist);

    // const token = await this.jwtService.generateToken(userProfile);

    const token = await this.authService.generateAccessToken(userExist);

    const refreshToken = await this.authService.generateRefreshToken(userExist);


    await this.refreshTokenRepository.create({
      userId: userExist.id,
      token: refreshToken,
      expiresIn: '7d'
    })


    return {
      user: userExist,
      accessToken: token,
      refreshToken: refreshToken,
      // expiresIn: '1m'
      expiresIn: '1d'
    }
  }


  @authenticate('jwt')
  @post('/auth/logout')
  @response(200, {
    content: {
      "application/json": {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'}
          }
        }
      }
    }
  })
  async logout(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              refreshToken: {type: 'string'}
            },
            required: ['refreshToken']
          }
        }
      }
    })
    data: {refreshToken: string}
  ): Promise<{message: string} | string> {

    if (!data.refreshToken) {
      throw new HttpErrors.BadRequest("Refresh Token is required")
    }


    const token = await this.refreshTokenRepository.findOne({
      where: {
        token: data.refreshToken
      }
    })

    if (!token) {
      throw new HttpErrors.Unauthorized("Invalid Token")
    }

    await this.refreshTokenRepository.deleteById(token.id);

    return {
      message: "Logged Out Successfully"
    }
  }



  @authenticate('jwt')
  @get('/auth/me')
  async getProfile(
    @inject(SecurityBindings.USER) currentUserProfile: UserProfile
  ): Promise<Omit<User, 'id'> | string> {

    const user = await this.userRepository.findOne({
      where: {
        email: currentUserProfile.email
      }
    })

    if (!user) {
      return JSON.stringify({message: "User Not Found"})
    }

    return user;


  }

  @post('/auth/register')
  @response(200, {
    description: 'Auth model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {exclude: ['id']}),
      }

    },
  })
  async register(
    @requestBody(
      {
        content: {
          "application/json": {
            schema: {
              type: 'object',
              properties: {
                name: {type: 'string'},
                email: {type: 'string'},
                password: {type: 'string'},
                confirmPassword: {type: 'string'},
                role: {type: 'string'},
                phone_number: {type: 'string'},
                address: {type: 'string'},
                tenantId: {type: 'number'}
              },
              required: ['name', 'email', 'password', 'confirmPassword']
            }
          }
        }
      }
    ) data: User & Auth & {confirmPassword: string},
  ): Promise<User | string> {

    if (data.password !== data.confirmPassword) {
      return JSON.stringify({message: "Password Doesn't Match"})
    }

    const userExist = await this.userRepository.findOne({
      where: {
        email: data.email
      }
    })


    if (userExist) {
      // return JSON.stringify({message: "User Already Exist ! Try another Email."})
      throw new HttpErrors.Conflict("User Already Exist ! Try another Email.")
    }

    let roleType;

    if (data?.role) {
      if (data.role === RoleType.ADMIN) {
        roleType = RoleType.ADMIN
      }
      else if (data.role === RoleType.SUPERADMIN) {
        roleType = RoleType.SUPERADMIN
      }
      else {
        roleType = RoleType.USER
      }
    }

    if (data?.tenantId == 0) {
      data.tenantId = 1;
    }

    const user = await this.userRepository.create({
      name: data.name,
      email: data.email,
      phone_number: data?.phone_number,
      address: data?.address,
      // roleId: data?.roleId,

      role: roleType,

      tenantId: data?.tenantId || 1,
    });

    // const hashedPassword = await hash(data.password, 10);
    const hashedPassword = await this.authService.hashPassword(data.password);

    await this.authRepository.create({
      user_id: user.id,
      password: hashedPassword
    });

    return user;
  }


  @post('/auth/verify')
  @response(200, {
    description: 'Auth model instance',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'}
          }
        }
      }
    },
  })
  async verify(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              token: {type: 'string'}
            },
            required: ['token']
          }
        }
      }
    })
    data: {token: string}
  ): Promise<string> {
    try {
      const decoded = await this.authService.verifyAccessToken(data.token);
      return JSON.stringify(decoded);
    } catch (error) {
      // return JSON.stringify(error.message);
      throw new HttpErrors.Unauthorized("Invalid Token")

    }
  }


  @post('/auth/refresh-token')
  @response(200, {
    description: 'Auth model instance',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            accessToken: {type: 'string'},
            refreshToken: {type: 'string'},
            expiresIn: {type: 'string'}
          }
        }
      }
    },
  })
  async refreshToken(
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              refreshToken: {type: 'string'}
            },
            required: ['refreshToken']
          }
        }
      }
    })
    data: {refreshToken: string}
  ): Promise<any | string> {




    const token = await this.refreshTokenRepository.findOne({
      where: {
        token: data.refreshToken
      }
    })

    if (!token) {
      throw new HttpErrors.Unauthorized("Invalid Token")
    }



    // verify refresh token

    const isValid = await this.authService.verifyRefreshToken(data.refreshToken);

    if (!isValid) {


      await this.refreshTokenRepository.deleteAll({
        token: data.refreshToken
      })
      throw new HttpErrors.Unauthorized("Invalid Token")
    }

    const user = await this.userRepository.findById(token.userId);

    if (!user) {
      throw new HttpErrors.NotFound("User Not Found")
    }



    const newAccessToken = await this.authService.generateAccessToken(user);

    const newRefreshToken = await this.authService.generateRefreshToken(user);

    await this.refreshTokenRepository.updateById(token.id, {
      token: newRefreshToken
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: '1d'
    }
  }


  @get('/auth/count')
  @response(200, {
    description: 'Auth model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    // @inject(RestBindings.Http.REQUEST) request: Request,
    // @inject('tenantId') tenantId: number,
    @param.where(Auth) where?: Where<Auth>

  ): Promise<Count> {


    // const ctx = getMiddlewareContext(request);
    // const tenatid = await ctx?.get('tenantId');
    // console.log(tenatid);
    // console.log(tenantId);


    return this.authRepository.count(where);
  }

  @get('/auth')
  @response(200, {
    description: 'Array of Auth model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Auth, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Auth) filter?: Filter<Auth>,
  ): Promise<Auth[]> {
    return this.authRepository.find(filter);
  }

  @patch('/auth/change-password')
  @response(200, {
    description: 'Auth PATCH success count',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {type: 'string'}
          }
        }
      }
    },
  })
  async changePassword(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Auth, {partial: true, exclude: ['id']}),
        },
      },
    })
    auth: Auth,
  ): Promise<string> {

    const userExist = await this.authRepository.findOne({
      where: {
        user_id: auth.user_id
      }
    })

    if (!userExist) {
      return JSON.stringify("User Doesn't Exist")
    }

    if (auth) {
      auth.password = await hash(auth.password, 10);
    }
    else {
      return JSON.stringify("Auth Object is Empty")
    }

    await this.authRepository.updateById(userExist.id, auth);
    return JSON.stringify("Password Updated Successfully")
  }

  @get('/auth/{id}')
  @response(200, {
    description: 'Auth model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Auth, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Auth, {exclude: 'where'}) filter?: FilterExcludingWhere<Auth>
  ): Promise<Auth> {
    return this.authRepository.findById(id, filter);
  }

  @patch('/auth/{id}')
  @response(204, {
    description: 'Auth PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Auth, {partial: true}),
        },
      },
    })
    auth: Auth,
  ): Promise<void> {
    if (auth) {
      auth.password = await hash(auth.password, 10);
    }
    else {
      return Promise.reject("Auth Object is Empty")
    }
    await this.authRepository.updateById(id, auth);
  }

  @put('/auth/{id}')
  @response(204, {
    description: 'Auth PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() auth: Auth,
  ): Promise<void> {
    await this.authRepository.replaceById(id, auth);
  }

  @del('/auth/{id}')
  @response(204, {
    description: 'Auth DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.authRepository.deleteById(id);
  }
}
