import {belongsTo, Entity, model, property} from '@loopback/repository';
import {User} from './user.model';

@model({
  name: 'user_credential'
})
export class Auth extends Entity {


  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;


  @belongsTo(() => User, {name: 'user', keyTo: 'id'})
  user_id: number;

  @property({
    type: 'string',
    required: true,
  })
  password: string;


  constructor(data?: Partial<Auth>) {
    super(data);
  }
}

export interface AuthRelations {
  // describe navigational properties here
  AuthUser?: User;
}

export type AuthWithRelations = Auth & AuthRelations;
