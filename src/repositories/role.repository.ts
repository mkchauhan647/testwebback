import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {AuthdbDataSource} from '../datasources';
import {Role, RoleRelations} from '../models';

export class RoleRepository extends DefaultCrudRepository<
  Role,
  typeof Role.prototype.id,
  RoleRelations
> {

  // public readonly tenant: BelongsToAccessor<Tenant, typeof Role.prototype.id>;



  constructor(
    @inject('datasources.authdb') dataSource: AuthdbDataSource,
    // @repository.getter("TenantRepository")
    // protected tenantRepository: Getter<TenantRepository>,
  ) {
    super(Role, dataSource);

    // this.tenant = this.createBelongsToAccessorFor('tenant', tenantRepository);
    // this.registerInclusionResolver('tenant', this.tenant.inclusionResolver);
  }
}
