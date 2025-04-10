// import {model, property} from '@loopback/repository';
// import {UserModifiableEntity} from './user-modifiable-entity.model';

// @model({settings: {strict: true}})
// export class AgeAndSexDistribution extends UserModifiableEntity {
//   @property({
//     type: 'number',
//     id: true,
//     generated: true,
//   })
//   id?: number;

//   @property({
//     type: 'string',
//     required: true,
//   })
//   ageGroup: string;

//   @property({
//     type: 'string',
//     required: true,
//   })
//   male: string;

//   @property({
//     type: 'string',
//     required: true,
//   })
//   female: string;

//   @property({
//     type: 'number',
//     default: 1,
//   })
//   tenantId: number;

//   @property({
//     type: 'string',
//     required: true,
//     jsonSchema: {
//       enum: ['en', 'ne'],
//     },
//   })
//   locale: string;

//   constructor(data?: Partial<AgeAndSexDistribution>) {
//     super(data);
//   }
// }

// export interface AgeAndSexDistributionRelations {
//   // define navigational properties here
// }

// export type AgeAndSexDistributionWithRelations = AgeAndSexDistribution & AgeAndSexDistributionRelations;
