import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {AuthdbDataSource} from '../datasources';
import {Role, Tenant, User, UserRelations} from '../models';
import {RoleRepository} from './role.repository';
import {TenantRepository} from './tenant.repository';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {

  public readonly role: BelongsToAccessor<Role, typeof User.prototype.id>;
  public readonly tenant: BelongsToAccessor<Tenant, typeof User.prototype.id>;


  constructor(
    // @inject('datasources.Operationaldb') dataSource: OperationaldbDataSource,
    @inject('datasources.authdb') dataSource: AuthdbDataSource,


    @repository.getter("RoleRepository")
    protected roleRepositoryGetter: Getter<RoleRepository>,

    @repository.getter("TenantRepository")
    protected tenantRepositoryGetter: Getter<TenantRepository>,

  ) {
    super(User, dataSource);

    // Roles
    // this.role = this.createBelongsToAccessorFor('role', roleRepositoryGetter);
    // this.registerInclusionResolver('role', this.role.inclusionResolver);

    // tenant
    this.tenant = this.createBelongsToAccessorFor('tenant', tenantRepositoryGetter);
    this.registerInclusionResolver('tenant', this.tenant.inclusionResolver);




  }
}
