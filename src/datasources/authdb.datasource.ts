import {inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {juggler} from '@loopback/repository';

const config = {
  name: 'authdb',
  connector: 'postgresql',
  url: '',
  host: '82.180.145.67',
  port: 5432,
  user: 'postgres',
  password: '8uO2%7bA!dK^zW$&',
  database: 'mnc-db',
  schema: 'authentication',
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class AuthdbDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'authdb';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.authdb', {optional: true})
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
