import {belongsTo, Entity, model, property} from '@loopback/repository';
import {User} from './user.model';

@model()
export class RefreshToken extends Entity {
  @property({type: 'number', id: true, generated: true})
  id?: number;

  @property({type: 'string', required: true})
  token: string;

  @property({type: 'date', defaultFn: 'now'})
  createdAt?: string;

  @property({type: 'date', defaultFn: 'now'})
  updatedAt?: string;

  @property({
    type: 'string',
    required: false,
  })
  expiresIn?: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isExpired?: boolean;

  @belongsTo(() => User)
  userId: number;

  constructor(data?: Partial<RefreshToken>) {
    super(data);
  }
}
