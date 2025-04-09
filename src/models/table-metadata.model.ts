import {hasMany, model, property} from '@loopback/repository';
import {Image} from './image.model';
import {TableMetadataImage} from './table-metadata-image.model';
import {UserModifiableEntity} from './user-modifiable-entity.model';

@model()
export class TableMetadata extends UserModifiableEntity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    index: true,
  })
  tableName: string;


  @property({
    type: 'string',
    default: 'en',
  })
  locale?: string;

  @property({
    type: "string",
  })
  title?: string;

  @property({
    type: 'object',
    // required: true,
  })
  dataFormat?: object;

  @property({
    type: 'string',
    required: true,
  })
  s3Url: string;

  @property({
    type: 'string',
  })
  fileSize?: string;


  @hasMany(() => Image, {through: {model: () => TableMetadataImage}})
  images?: Image[];


  // @belongsTo(() => User, {name: 'user', keyTo: 'id'})
  // userId: number;

  // @belongsTo(() => Tenant, {name: 'tenant', keyTo: 'id'})
  // tenantId?: number;

  constructor(data?: Partial<TableMetadata>) {
    super(data);
  }
}
