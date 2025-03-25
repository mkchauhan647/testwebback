import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {OperationaldbDataSource} from '../datasources';
import {Summary, SummaryRelations} from '../models';

export class SummaryRepository extends DefaultCrudRepository<
  Summary,
  typeof Summary.prototype.id,
  SummaryRelations
> {
  constructor(
    @inject('datasources.Operationaldb') dataSource: OperationaldbDataSource,
  ) {
    super(Summary, dataSource);
  }
}
