import {authenticate} from '@loopback/authentication';
import {UserWithRelations} from '@loopback/authentication-jwt';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
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
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {User} from '../models';
import {AuthRepository, UserRepository} from '../repositories';
import {AuthService} from '../services';

export class UserController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @inject('services.AuthService')
    private authService: AuthService,
    @repository(AuthRepository)
    protected authRepo: AuthRepository
  ) { }

  @post('/users')
  @response(200, {
    description: 'User model instance',
    content: {'application/json': {schema: getModelSchemaRef(User)}},
  })
  async create(
    // @requestBody({
    //   content: {
    //     'application/json': {
    //       schema: getModelSchemaRef(UserWitrelations, {
    //         title: 'NewUser',
    //         exclude: ['id'],
    //       }),
    //     },
    //   },
    // })
    // user: Omit<UserWithRelations, 'id'>,
    @requestBody()
    user: any
  ): Promise<User> {

    if (!user) {
      throw new Error('User data is required');
    }

    const userExist = await this.userRepository.findOne({
      where: {
        email: user.email,
      },
    });
    if (userExist) {
      throw new Error('User already exists');
    }
    const password = user?.password

    if (password) {
      const hashedPassword = await this.authService.hashPassword(password);
      user.password = hashedPassword;
    }
    else {
      user.password = this.authService.generatePassword();
      const hashedPassword = await this.authService.hashPassword(user.password);
      user.password = hashedPassword;
    }

    const createdUser = await this.userRepository.create({
      name: user.name,
      email: user.email,
      address: user?.address || '',
      phone_number: user?.phone_number || '',
      isActive: user?.isActive || true,
      role: user?.role || 'user',
      tenantId: user?.tenantId || 1,
    });


    if (createdUser) {
      const auth = {
        user_id: createdUser.id,
        password: user.password,
      };
      await this.authRepo.create(auth);
    }

    return createdUser;

  }

  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'superadmin']})
  @get('/users/count')
  @response(200, {
    description: 'User model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    return this.userRepository.count(where);
  }

  @get('/users')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find(filter);
  }


  @authenticate('jwt')
  @authorize({allowedRoles: ['admin', 'superadmin']})
  @get('/users/tenantid/{tenantId}')
  @response(200, {
    description: 'Array of User model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(User, {includeRelations: true}),
        },
      },
    },
  })
  async findByTenantId(
    @param.path.number('tenantid') tenantId: number,
    @param.filter(User) filter?: Filter<User>,
  ): Promise<User[]> {
    return this.userRepository.find({where: {tenantId: tenantId}});
  }




  @authenticate('jwt')
  @patch('/adminonly-users')
  @response(200, {
    description: 'User PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(User, {partial: true}),
        },
      },
    })
    user: User,
    @param.where(User) where?: Where<User>,
  ): Promise<Count> {
    // return this.userRepository.updateAll(user, where);
    return {
      count: 0,
    }
  }

  @authenticate('jwt')
  @get('/users/{id}')
  @response(200, {
    description: 'User model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(User, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(User, {exclude: 'where'}) filter?: FilterExcludingWhere<User>
  ): Promise<User> {
    return this.userRepository.findById(id, filter);
  }

  @authenticate('jwt')
  // @authorize({allowedRoles: ['admin', 'superadmin']})
  @patch('/users/{id}')
  @response(204, {
    description: 'User PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    // @requestBody({
    //   content: {
    //     'application/json': {
    //       schema: getModelSchemaRef(User, {partial: true}),
    //     },
    //   },
    // })
    @requestBody()
    user: Partial<UserWithRelations>,
  ): Promise<Partial<User>> {

    let updateUser;

    const {password, ...userData} = user;


    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const existingAuth = await this.authRepo.findOne({
      where: {
        user_id: id,
      },
    });

    if (existingAuth && password?.length > 0) {
      console.log("no enter")
      const isPasswordMatch = await this.authService.comparePassword(
        await this.authService.hashPassword(password),
        existingAuth.password,
      );

      if (isPasswordMatch) {
        throw new Error('New password cannot be same as old password');
      }
    }
    if (!existingAuth) {
      console.log("enter create")
      const password = await this.authService.generatePassword();
      const hashedPassword = await this.authService.hashPassword(password);
      await this.authRepo.create({
        user_id: existingUser.id,
        password: hashedPassword,
      })
    }

    if (userData.email && userData.email !== existingUser.email) {
      const userExist = await this.userRepository.findOne({
        where: {
          email: userData.email,
        },
      });
      if (userExist) {
        throw new Error('User already exists');
      }
    }

    await this.userRepository.updateById(id, {
      name: userData?.name || existingUser.name,
      email: userData?.email || existingUser.email,
      address: userData?.address || existingUser.address,
      phone_number: userData?.phone_number || existingUser.phone_number,
      isActive: userData?.isActive || existingUser.isActive,
      role: userData?.role || existingUser.role,
      tenantId: userData?.tenantId || existingUser.tenantId,
    });

    if (password && password?.length > 0) {
      console.log("enter")
      const hashedPassword = await this.authService.hashPassword(user.password);
      // user.password = hashedPassword;
      await this.authRepo.updateAll({password: hashedPassword}, {user_id: id});
    }

    const updatedUser = await this.userRepository.findById(id);
    return updatedUser;
  }

  @authenticate('jwt')
  @put('/users/{id}')
  @response(204, {
    description: 'User PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() user: User,
  ): Promise<void> {
    await this.userRepository.replaceById(id, user);
  }

  @authenticate('jwt')
  @del('/users/{id}')
  @response(204, {
    description: 'User DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.userRepository.deleteById(id);
  }
}
