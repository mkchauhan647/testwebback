import {belongsTo, Entity, model, property} from '@loopback/repository';
import {Image} from './image.model';
import {TableMetadata} from './table-metadata.model';

@model()
export class TableMetadataImage extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  // @property({type: 'number'})
  // tableMetadataId: number;

  // @property({type: 'number'})
  // imageId: number;

  @belongsTo(() => Image, {name: 'image', keyTo: 'id'})
  imageId: number;

  @belongsTo(() => TableMetadata, {name: 'tableMetadata', keyTo: 'id'})
  tableMetadataId: number;


  constructor(data?: Partial<TableMetadataImage>) {
    super(data);
  }
}
