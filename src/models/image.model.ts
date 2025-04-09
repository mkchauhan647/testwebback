import {hasMany, model, property} from '@loopback/repository';
import {TableMetadataImage} from './table-metadata-image.model';
import {TableMetadata} from './table-metadata.model';
import {UserModifiableEntity} from './user-modifiable-entity.model';

@model()
export class Image extends UserModifiableEntity {
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
  filename: string;

  @property({
    type: 'string',
    required: true,
  })
  url: string;



  @hasMany(() => TableMetadata, {through: {model: () => TableMetadataImage}})
  tableMetadata?: TableMetadata[];

  constructor(data?: Partial<Image>) {
    super(data);
  }
}
