import {belongsTo, model, property} from '@loopback/repository';
import {hiddenProperties} from '../utils/hiddenProps';
import {RoleType} from '../utils/types';
import {Tenant} from './tenant.model';
import {UserModifiableEntity} from './user-modifiable-entity.model';

@model({
  name: "users",
  settings: {
    hiddenProperties: [...hiddenProperties]
  }
})
export class User extends UserModifiableEntity {

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
  })
  address?: string;

  @property({
    type: 'boolean',
    default: true,
  })
  isActive?: boolean;

  @property({
    type: 'string',
  })
  phone_number?: string;

  // @belongsTo(() => Role, {name: 'role', keyTo: 'id'})
  // roleId?: number;

  @property({
    type: 'string',
    default: RoleType.USER,
  })
  role?: RoleType;

  @belongsTo(() => Tenant, {name: 'tenant', keyTo: 'id'})
  tenantId?: number;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  // describe navigational properties here
}

export type UserWithRelations = User & UserRelations;
