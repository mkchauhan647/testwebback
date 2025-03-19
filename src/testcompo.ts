import {
  Application,
  Component,
  CoreBindings,
  inject,
  LifeCycleObserver,
} from '@loopback/core';

export class MyComponent implements Component, LifeCycleObserver {
  status = 'not-initialized';
  initialized = false;

  // Contribute bindings via properties
  controllers = [];
  bindings = [];

  constructor(@inject(CoreBindings.APPLICATION_INSTANCE) private app: Application) {
    // Contribute bindings via constructor
    this.app.bind('foo').to('bar');
  }


  async init() {
    // Contribute bindings via `init`
    const val = await readFromConfig();
    this.app.bind('abc').to(val);

    this.status = 'initialized';
    this.initialized = true;
  }

  async start() {
    this.status = 'started';
  }

  async stop() {
    this.status = 'stopped';
  }
}
async function readFromConfig() {
  // throw new Error('Function not implemented.');

  return 'val';
}

