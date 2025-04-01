// src/models/footer.model.ts
import {belongsTo, model, property} from '@loopback/repository';
import {hiddenProperties} from '../utils/hiddenProps';
import {Tenant} from './tenant.model';
import {UserModifiableEntity} from './user-modifiable-entity.model';

@model({
  name: 'footers',
  settings: {
    hiddenProperties: [...hiddenProperties]
  }
})
export class Footer extends UserModifiableEntity {


  @property({
    type: "number",
    id: true,
    generated: true
  })
  id?: number;


  @property({
    type: 'string',
    required: true,
  })
  websiteName: string;

  @property({
    type: 'object',
  })
  logo1?: {
    url: string;
    name: string;
  };
  @property({
    type: 'object',
  })
  logo2?: {
    url: string;
    name: string;
  };
  @property({
    type: 'object',
  })
  logo3?: {
    url: string;
    name: string;
  };

  @property({
    type: 'string',
    // required: true,
    default: 'no description',
  })
  description?: string;

  @property({
    type: 'string',
    // required: true,
  })
  contact?: string;

  @property({
    type: 'string',
    // required: true,
    default: "© 2025 All rights reserved"
  })
  copyrightText?: string;

  @belongsTo(() => Tenant, {name: 'tenant', keyTo: "id"})
  tenantId?: number;

  constructor(data?: Partial<Footer>) {
    super(data);
  }
}

export interface FooterRelations {
  // describe navigational properties here
}

export type FooterWithRelations = Footer & FooterRelations;
