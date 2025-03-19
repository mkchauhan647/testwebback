import {Entity, model, property} from '@loopback/repository';
import {hiddenProperties} from '../utils/hiddenProps';
import {RoleType} from '../utils/types';

@model({
  name: "roles",
  settings: {
    hiddenProperties: [...hiddenProperties]
  }
})


export class Role extends Entity {


  @property({
    type: "number",
    id: true,
    generated: true
  })
  id?: number

  @property({
    type: 'string',
    required: true,
  })
  name: string;


  @property({
    type: 'string',
    default: RoleType.USER,
  })
  type: RoleType;


  @property({
    type: 'array',
    itemType: 'string',
  })
  permissions?: string[];

  // @belongsTo(() => Tenant, {name: 'tenant', keyTo: "id"})
  // tenantId?: number;


  constructor(data?: Partial<Role>) {
    super(data);
  }
}

export interface RoleRelations {
  // describe navigational properties here
}

export type RoleWithRelations = Role & RoleRelations;
