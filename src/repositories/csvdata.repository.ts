import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {OperationaldbDataSource} from '../datasources';
import {Csvdata, CsvdataRelations} from '../models';

export class CsvdataRepository extends DefaultCrudRepository<
  Csvdata,
  typeof Csvdata.prototype.id,
  CsvdataRelations
> {
  constructor(
    @inject('datasources.Operationaldb') dataSource: OperationaldbDataSource,
  ) {
    super(Csvdata, dataSource);
  }
}
