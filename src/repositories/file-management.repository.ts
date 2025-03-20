import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {OperationaldbDataSource} from '../datasources';
import {FileManagement, FileManagementRelations} from '../models';

export class FileManagementRepository extends DefaultCrudRepository<
  FileManagement,
  typeof FileManagement.prototype.id,
  FileManagementRelations
> {
  constructor(
    @inject('datasources.Operationaldb') dataSource: OperationaldbDataSource,
  ) {
    super(FileManagement, dataSource);
  }
}
