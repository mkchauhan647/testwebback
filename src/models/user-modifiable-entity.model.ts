import {property} from '@loopback/repository';

import {BaseEntity} from './base-entity.model';

export abstract class UserModifiableEntity extends BaseEntity {
  @property({
    type: 'number',
    name: 'created_by',
    hidden: true,
  })
  createdBy?: number;

  @property({
    type: 'number',
    name: 'modified_by',
    hidden: true,
  })
  modifiedBy?: number;
}
