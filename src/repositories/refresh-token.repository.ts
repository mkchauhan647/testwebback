import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {OperationaldbDataSource} from '../datasources';
import {RefreshToken, User} from '../models';
import {UserRepository} from './user.repository';

export class RefreshTokenRepository extends DefaultCrudRepository<RefreshToken, typeof RefreshToken.prototype.id> {
  public readonly user: BelongsToAccessor<User, typeof RefreshToken.prototype.id>;

  constructor(@inject('datasources.authdb') dataSource: OperationaldbDataSource, @repository.getter('UserRepository') userRepoGetter: Getter<UserRepository>) {
    super(RefreshToken, dataSource);
    this.user = this.createBelongsToAccessorFor('user', userRepoGetter);
  }
}
