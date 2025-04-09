import {belongsTo, model, property} from '@loopback/repository';
import {hiddenProperties} from '../utils/hiddenProps';
import {Tenant} from './tenant.model';
import {UserModifiableEntity} from './user-modifiable-entity.model';

@model({
  name: 'summary',
  // settings: {
  // hiddenProperties: [...hiddenProperties],
  // }
  settings: {
    hiddenProperties: [...hiddenProperties],
    indexes: {
      uniqueSummaryPerLocale: {
        keys: {
          tenantId: 1,
          locale: 1
        },
        options: {
          unique: true
        }
      }
    }
  }
})
export class Summary extends UserModifiableEntity {
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
  title: string;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  description: string;

  @property({
    type: 'string',
  })
  imageUrl?: string;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  createdAt?: Date;

  @property({
    type: 'string',
    default: 'en'
  })
  locale?: string;

  @property({
    type: 'date',
    default: () => new Date(),
  })
  updatedAt?: Date;

  @belongsTo(() => Tenant, {keyTo: 'id'})
  tenantId?: number;

  // Should belongs to specific Municipality

  constructor(data?: Partial<Summary>) {
    super(data);
  }
}

export interface SummaryRelations {
}

export type SummaryWithRelations = Summary & SummaryRelations;
