// src/repositories/table-metadata.repository.ts
import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {OperationaldbDataSource} from '../datasources';
import {TableMetadata} from '../models';

export class TableMetadataRepository extends DefaultCrudRepository<
  TableMetadata,
  typeof TableMetadata.prototype.id
> {
  constructor(
    @inject('datasources.Operationaldb') dataSource: OperationaldbDataSource
  ) {
    super(TableMetadata, dataSource);
  }

  // Method to find by table name
  async findByTableName(tableName: string): Promise<TableMetadata | null> {
    return this.findOne({where: {tableName}});
  }
}
