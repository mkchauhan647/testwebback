import {Entity, model, property} from '@loopback/repository';

@model()
export class Csvdata extends Entity {


  @property({
    type: "number",
    id: true,
    generated: true
  })
  id?: "number"


  @property({
    type: 'string',
    required: true,
  })
  sourceFileName: string;  // Optionally store which CSV file the data came from

  @property({
    type: 'object',
    required: true,
  })
  data: object;  // Store each CSV row as a dynamic JSON object

  constructor(data?: Partial<Csvdata>) {
    super(data);
  }
}

export interface CsvdataRelations {
  // describe navigational properties here
}

export type CsvdataWithRelations = Csvdata & CsvdataRelations;
