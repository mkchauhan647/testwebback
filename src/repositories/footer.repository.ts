import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {OperationaldbDataSource} from '../datasources';
import {Footer, FooterRelations} from '../models';

export class FooterRepository extends DefaultCrudRepository<
  Footer,
  typeof Footer.prototype.id,
  FooterRelations
> {
  constructor(
    @inject('datasources.Operationaldb') dataSource: OperationaldbDataSource,
  ) {
    super(Footer, dataSource);
  }
}
