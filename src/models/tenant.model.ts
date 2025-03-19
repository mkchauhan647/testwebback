import {model, property} from '@loopback/repository';
import {hiddenProperties} from '../utils/hiddenProps';
import {UserModifiableEntity} from './user-modifiable-entity.model';

@model(
  {
    name: "tenants",
    settings: {
      hiddenProperties: [...hiddenProperties]
    }
  }
)
export class Tenant extends UserModifiableEntity {


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




  constructor(data?: Partial<Tenant>) {
    super(data);
  }
}

export interface TenantRelations {
  // describe navigational properties here
}

export type TenantWithRelations = Tenant & TenantRelations;
