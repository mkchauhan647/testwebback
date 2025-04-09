import {belongsTo, model, property} from '@loopback/repository';
import {hiddenProperties} from '../utils/hiddenProps';
import {Tenant} from './tenant.model';
import {UserModifiableEntity} from './user-modifiable-entity.model';

@model({
  name: 'files',
  settings: {
    hiddenProperties: [...hiddenProperties]
  }
})
export class FileManagement extends UserModifiableEntity {


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
  filename: string;

  @property({
    type: 'string',
    required: true,
  })
  url: string;

  @property({
    type: 'string',
    required: true,
  })
  fileSize?: string;

  @belongsTo(() => Tenant, {name: 'tenant', keyTo: "id"})
  tenantId?: number;



  constructor(data?: Partial<FileManagement>) {
    super(data);
  }
}

export interface FileManagementRelations {
  // describe navigational properties here
}

export type FileManagementWithRelations = FileManagement & FileManagementRelations;
