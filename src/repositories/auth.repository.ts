import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {AuthdbDataSource} from '../datasources';
import {Auth, AuthRelations, User} from '../models';
import {UserRepository} from './user.repository';

export class AuthRepository extends DefaultCrudRepository<
  Auth,
  typeof Auth.prototype.id,
  AuthRelations
> {

  public readonly user: BelongsToAccessor<User, typeof Auth.prototype.id>
  constructor(
    @inject('datasources.authdb') dataSource: AuthdbDataSource,
    @repository.getter("UserRepository")
    protected userRepositoryGetter: Getter<UserRepository>,
  ) {
    super(Auth, dataSource);

    this.user = this.createBelongsToAccessorFor('user', userRepositoryGetter)
    this.registerInclusionResolver('user', this.user.inclusionResolver)


  }
}
