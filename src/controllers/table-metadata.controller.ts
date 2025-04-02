import {authenticate} from '@loopback/authentication';
import {UserRepository} from '@loopback/authentication-jwt';
import {authorize} from '@loopback/authorization';
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  del,
  get,
  HttpErrors,
  param,
  patch,
  post,
  Request,
  requestBody,
  response,
  Response,
  RestBindings
} from '@loopback/rest';
import {writeFileSync} from 'fs';
import {tmpdir} from 'os';
import {join} from 'path';
import {TableMetadata} from '../models';
import {TableMetadataRepository} from '../repositories';
import {CsvProcessorService} from '../services';
import {S3Service} from '../services/s3-service.service';

export class TableMetadataController {
  constructor(
    @repository(TableMetadataRepository)
    public tableMetadataRepository: TableMetadataRepository,
    @inject('services.CsvProcessorService')
    private csvProcessor: CsvProcessorService,
    @inject('services.S3Service')
    private s3Service: S3Service,
    @inject(RestBindings.Http.RESPONSE) private response: Response,
    @repository(UserRepository)
    public userRepository: UserRepository
  ) { }

  @post('/upload', {
    responses: {
      '200': {
        description: 'File Upload Success',
        content: {'application/json': {schema: {message: 'string', filename: 'string'}}},
      },
    },
  })
  async uploadFile(

    @requestBody.file()

    // req: any,
    @inject(RestBindings.Http.REQUEST) req: Request, // Inject Request Object
  ): Promise<object> {
    const file = req.file;

    console.log('file', file);
    // console.log("body", body);
    console.log("reqbody", req.body);

    if (!file) {
      throw new Error('No file uploaded');
    }
    return {message: 'File uploaded successfully', filename: file.originalname};
  }


  @del('/table-metadata/{tableName}', {
    responses: {
      '200': {
        description: 'Table deleted successfully',
        content: {'application/json': {schema: {message: 'string'}}},
      },
      '400': {
        description: 'Invalid Table Name',
        content: {'application/json': {schema: {message: 'string'}}},
      },
    },
  })
  async deleteTable(
    @param.path.string('tableName') tableName: string, // Get table name from path
    @inject(RestBindings.Http.RESPONSE) response: Response
  ) {
    try {
      if (!tableName.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error('Invalid table name');
      }

      const table = await this.tableMetadataRepository.findOne({where: {tableName}});
      if (!table) {
        throw new Error('Table not found');
      }


      const query = `DROP TABLE IF EXISTS ${tableName}`;
      await this.tableMetadataRepository.dataSource.execute(query); // Execute raw SQL query
      await this.tableMetadataRepository.deleteAll({tableName}); // Delete metadata

      // also delete the file upload to s3 bucket

      // const key = `csv-files/${tableName}.csv`;
      const key = `csv-files/${table.s3Url.split('/').slice(-1)[0]}`;

      console.log("keyinsidelete", key);


      this.s3Service.deleteFile(key);

      return response.status(200).send({message: `Table ${tableName} deleted successfully`});
    } catch (error) {
      return response.status(400).send({message: error.message});
    }
  }

  @post('/table-metadata', {
    responses: {
      200: {
        description: 'Create table metadata and upload CSV',
        content: {
          'application/json': {schema: {'x-ts-type': TableMetadata}},
        },
      },
    },
  })
  async create(
    @requestBody.file()
    request: any,
  ): Promise<TableMetadata | any> {

    console.log('request', request.file);
    console.log('request', request.body);

    try {
      // Extract file and fields data
      // const file = request.file;
      const files = request.files;
      const file = Array.isArray(files) ? files[0] : null;
      let fields = {
        tableName: request.body.tableName,
        dataFormat: JSON.parse(request.body.dataFormat || 'null'),
        title: request.body.title || null,
      };

      if (!fields.dataFormat) {

        console.log("its null");

      }


      const fileSize = file.size;

      // return {message: 'File uploaded successfully', filename: file.originalname, fileSize: fileSize};

      console.log('Raw fields:', fields);
      console.log('Uploaded file:', file);


      // Debugging: Log the buffer to check its value
      console.log('File buffer:', file ? file.buffer : 'No file');

      console.log("hllo sir ??")
      console.log('request', request.body);
      console.log("reqfile", request.file);

      if (!fields) {
        // fields = {tableName: "testing5", dataFormat: {"name": "string", "address": "string", "age": "string", "user": {"email": "string", "test": "string"}}};

        // return JSON.stringify({message: 'Fields are required {tableName, dataFormat}'});
        throw new Error('Fields are required {tableName, dataFormat}');
      }

      if (!file || !fields?.tableName) {
        throw new Error('Missing required fields');
      }


      // check table exist or not
      const tableExist = await this.tableMetadataRepository.findOne({where: {tableName: fields.tableName}});
      if (tableExist) {
        throw new Error('Table already exists');
      }


      // Save the uploaded file to a temporary path
      const tempPath = join(tmpdir(), `${Date.now()}.csv`);

      // Make sure file.buffer is defined and is a valid buffer
      if (!file.buffer) {
        throw new Error('File buffer is undefined');
      }

      writeFileSync(tempPath, file.buffer);

      const {dataFormat, sanitizedData} = await this.csvProcessor.processCsv(
        tempPath,
        fields.dataFormat,
      );

      const key = `csv-files/${Date.now()}-${fields.tableName}.csv`;

      const s3Url = await this.s3Service.uploadFile(tempPath, key);

      console.log("dataformat", dataFormat);
      console.log("sanitizedData", sanitizedData);


      const metadata = await this.tableMetadataRepository.create({
        tableName: fields.tableName.toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, ''),
        dataFormat,
        s3Url: s3Url,
        fileSize: fileSize.toString(),
        title: fields.title,
      });

      // const metadata = await this.tableMetadataRepository.findById(1);

      await this.createDynamicTable(fields.tableName, dataFormat);
      await this.insertDataIntoTable(fields.tableName, sanitizedData);

      return metadata;
    } catch (error) {
      console.log(error);
      if (error.code === 'ER_DUP_ENTRY' || error.code == 23505) {
        throw new HttpErrors.Conflict('Table already exists');
      }
      throw new HttpErrors.BadRequest(error.message);
    }
  }


  private async createDynamicTable(tableName: string, format: object) {
    const columns = this.generateColumnDefinitions(format);

    // Ensure ID column is always included
    // columns.unshift("id INT AUTO_INCREMENT PRIMARY KEY");
    columns.unshift("id SERIAL PRIMARY KEY");


    console.log("cols", columns);


    await this.tableMetadataRepository.dataSource.execute(
      `CREATE TABLE ${this.sanitizeTableName(tableName)} (${columns.join(',')})`,
    );
  }

  private generateColumnDefinitions(format: object, prefix = ''): string[] {
    let columns: string[] = [];

    for (const [key, value] of Object.entries(format)) {
      // const fullKey = prefix ? `${prefix}_${key}` : key;
      const fullKey = key;

      if (typeof value === 'object' && value !== null) {
        columns = columns.concat(this.generateColumnDefinitions(value, fullKey));
      } else {
        columns.push(`${this.sanitizeColumnName(fullKey)} TEXT`);
      }
    }

    return columns;
  }

  private sanitizeTableName(name: string): string {
    return `"${name.toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '')}"`;
  }

  private sanitizeColumnName(name: string): string {
    return `"${name}"`;
  }

  private async insertDataIntoTable(tableName: string, data: object[], operationType?: string) {
    if (!data.length) {
      throw new Error('No data provided for insertion');
    }

    const columns = Object.keys(data[0]); // Extract column names
    const values: any[] = []; // Store all values for insertion
    let placeholderIndex = 1; // PostgreSQL uses $1, $2, $3...

    const valuePlaceholders = data.map((record) => {
      const rowPlaceholders = columns.map(() => `$${placeholderIndex++}`);
      values.push(...columns.map(col => record[col as keyof typeof record]));
      return `(${rowPlaceholders.join(', ')})`;
    });

    if (operationType == 'replace') {

      // empty the table first
      // const query = `TRUNCATE TABLE ${this.sanitizeTableName(tableName)}`;
      // and also reset the id sequence
      const query = `TRUNCATE TABLE ${this.sanitizeTableName(tableName)} RESTART IDENTITY CASCADE`;
      await this.tableMetadataRepository.dataSource.execute(query);
      // and then insert the new data
      const query1 = `
      INSERT INTO ${this.sanitizeTableName(tableName)}
      (${columns.map(c => this.sanitizeColumnName(c)).join(', ')})
      VALUES ${valuePlaceholders.join(', ')}
    `;

      await this.tableMetadataRepository.dataSource.execute(query1, values);

    }
    else {

      // Final query
      const query = `
    INSERT INTO ${this.sanitizeTableName(tableName)}
    (${columns.map(c => this.sanitizeColumnName(c)).join(', ')})
    VALUES ${valuePlaceholders.join(', ')}
  `;

      // Execute the query with parameterized values
      await this.tableMetadataRepository.dataSource.execute(query, values);

    }

  }


  @get('/table-metadata/{tableName}', {
    responses: {
      '200': {
        description: 'Table metadata',
        content: {
          'application/json': {schema: {'x-ts-type': TableMetadata}},
        },
      },
    },
  })
  async getTableMetadata(
    @param.path.string('tableName') tableName: string,
  ): Promise<TableMetadata> {

    const metadata = await this.tableMetadataRepository.findOne({where: {tableName}});

    if (!metadata) {
      throw new HttpErrors.NotFound('Table not found');
    }
    return metadata;
  }






  @get('/table-metadata')
  async getAllTables(): Promise<TableMetadata[]> {
    return this.tableMetadataRepository.find();
  }


  @get('/table-metadata/{tableName}/data')
  async getTableData(
    @param.path.string('tableName') tableName: string,
  ): Promise<object[]> {

    // const sanitizeTableName = this.sanitizeTableName(tableName);

    if (!tableName) {
      throw new HttpErrors.BadRequest('Table name is required');
    }

    const sanitizeTableName = tableName.toLowerCase().trim().replace(/[^a-zA-Z0-9_]/g, '')

    console.log("sanitizetable", sanitizeTableName);

    const metadata = await this.tableMetadataRepository.findOne({
      where: {tableName: sanitizeTableName},
    });

    console.log("metadata", metadata);


    if (!metadata) {
      throw new HttpErrors.NotFound('Table not found');
    }

    const rawData = await this.tableMetadataRepository.dataSource.execute(
      `SELECT * FROM ${this.sanitizeTableName(tableName)}`,
    );

    // console.log("rowData", rawData);


    console.log("metadata", metadata.dataFormat);

    const dataFormat = {id: "number", ...metadata.dataFormat}

    return rawData.map((row: any) =>
      this.transformToNestedFormat(row, dataFormat)
    );
  }


  private transformToNestedFormat(row: object, format: object, keyPrefix: string = ''): object {
    const result: any = {};

    for (const [key, value] of Object.entries(format)) {
      // const currentKey = keyPrefix ? `${keyPrefix}.${key}` : key;
      const currentKey = key

      if (typeof value === 'object' && value !== null) {
        result[key] = this.transformToNestedFormat(row, value, currentKey);
      } else {
        const flatKey = this.findFlatKey(row, currentKey);
        result[key] = row[flatKey as keyof typeof row];
      }
    }

    return result;
  }


  private findFlatKey(row: object, nestedKey: string): string | null {
    const keys = Object.keys(row);
    return keys.find(k => k.replace(/_/g, '') === nestedKey.replace(/_/g, '')) ?? null;
  }



  @patch('/table-metadata/{tableName}', {
    responses: {
      '200': {
        description: 'Table Metadata Update',
        content: {'application/json': {schema: {message: 'string'}}},
      },
      '400': {
        description: 'Invalid Table Name or Missing Data',
        content: {'application/json': {schema: {message: 'string'}}},
      },
    },
  })
  async updateTableMetadata(
    @requestBody({
      content: {
        "multipart/form-data": {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              tableName: {type: 'string'},
              title: {type: 'string'},
              dataFormat: {type: 'object'},
              file: {type: 'string', format: 'binary'},
            },
          },
        },
      }
    })

    @param.path.string('tableName') tableName: string,
    request: any, // Request body for the update


  ): Promise<object | any> {

    try {
      // Find existing metadata based on tableName
      const tableMetadata = await this.tableMetadataRepository.findOne({where: {tableName}});

      console.log("tablefound", tableName)



      if (!tableMetadata) {
        throw new HttpErrors.NotFound('Table not found');
      }
      const tableMetadataOld = JSON.parse(JSON.stringify(tableMetadata));

      const updates = request;

      console.log("body", request.body);




      if (updates?.body?.tableName && updates?.body?.tableName !== tableMetadata.tableName) {
        // Check if new tableName is valid and not already in use

        console.log("table name modified")



        const existingTable = await this.tableMetadataRepository.findOne({where: {tableName: updates.body.tableName}});
        if (existingTable) {
          throw new HttpErrors.Conflict('Table with the new name already exists');
        }
        // Update tableName in the metadata (sanitize before saving)
        tableMetadata.tableName = updates.body.tableName.trim().replace(/[^a-zA-Z0-9_]/g, '');
      }



      if (updates?.body?.title) {
        // Update the dataFormat in the metadata
        tableMetadata.title = updates.body?.title;
      }

      if (updates.files) {
        // Process the new file, save it to temporary storage and upload to S3
        const files = updates.files;
        const file = Array.isArray(files) ? files[0] : null;
        if (file) {
          const tempPath = join(tmpdir(), `${Date.now()}.csv`);

          if (!file.buffer) {
            throw new Error('File buffer is undefined');
          }
          writeFileSync(tempPath, file.buffer);

          // Process CSV and upload to S3
          const {sanitizedData, dataFormat} = await this.csvProcessor.processCsv(tempPath);
          const key = `csv-files/${Date.now()}-${tableMetadata.tableName}.csv`;
          const s3Url = await this.s3Service.uploadFile(tempPath, key);

          console.log("s3url", s3Url);


          console.log("format", dataFormat);

          // Update metadata with the new file information
          tableMetadata.s3Url = s3Url;
          tableMetadata.fileSize = file.size.toString();
          tableMetadata.dataFormat = dataFormat;

          // Update dynamic table with new data (assuming this step is needed)
          // await this.createDynamicTable(tableMetadata.tableName, dataFormat);

          console.log("oldformat", tableMetadataOld.dataFormat);
          console.log("newformat", tableMetadata.dataFormat);

          console.log("isEqual", await
            this.isEqual(tableMetadata.dataFormat, tableMetadataOld.dataFormat)
          )


          // let operationType = 'replace';

          if (tableMetadata.tableName !== tableMetadataOld.tableName || !(await this.isEqual(tableMetadata.dataFormat, tableMetadataOld.dataFormat))) {
            console.log("table name or data format modified")

            // drop the table and create new one
            await this.tableMetadataRepository.dataSource.execute(`DROP TABLE IF EXISTS ${tableMetadataOld.tableName}`);


            await this.createDynamicTable(tableMetadata.tableName, dataFormat);
          }
          await this.insertDataIntoTable(tableMetadata.tableName, sanitizedData, 'replace');

          console.log("file modified")

        }
      }

      // Save the updated metadata to the repository

      console.log("tableMetadata", tableMetadata);


      const updatedMetadata = await this.tableMetadataRepository.save(tableMetadata);

      if (updatedMetadata) {
        // Delete the old file from S3 and temporary storage and delete the existing table
        const key = `csv-files/${tableMetadataOld.s3Url.split('/').slice(-1)[0]}`;


        console.log("old", tableMetadataOld.s3Url.split('/').slice(-1)[0]);
        console.log("new", updatedMetadata.s3Url.split('/').slice
          (-1)[0]);


        if (tableMetadata.s3Url.split('/').slice(-1)[0] !== tableMetadataOld.s3Url.split('/').slice(-1)[0]) {
          console.log("existing file deleted")
          await this.s3Service.deleteFile(key);
        }
        // if (tableMetadata.tableName !== tableMetadataOld.tableName) {
        //   console.log("existing table deleted")
        //   const query = `DROP TABLE IF EXISTS ${tableMetadataOld.tableName}`;
        //   await this.tableMetadataRepository.dataSource.execute(query); // Execute raw SQL query
        // }
      }

      console.log("is it okay?")

      return this.response.status(200).send({message: 'Table metadata updated successfully', metadata: updatedMetadata});
    } catch (error) {
      return this.response.status(400).send({message: error.message});
    }
  }


  async isEqual(obj1: any, obj2: any):
    Promise<boolean> {
    if (typeof obj1 !== "object" || typeof obj2 !== "object" || obj1 === null || obj2 === null) {
      return obj1 === obj2;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false; // Different number of keys

    return keys1.every(key =>
      keys2.includes(key) && this.isEqual(obj1[key], obj2[key])
    );
  };





  @get('/test-endpoint',
    {
      responses: {
        '200': {
          description: 'Test endpoint',
          content: {'application/json': {schema: {message: 'string'}}},
        },
      },
    }
  )
  @authenticate('jwt')
  @authorize({
    allowedRoles: ['admin'],
    // voters: ['authorizationProviders.roleAuthorizer'], // Match the provider binding name
  })
  async testEndpoint() {
    return {message: 'Hello, world!'};
  }


  @get('/stats')
  @response(200, {
    description: 'Stats',
    content: {
      'application/json': {
        schema:
        {
          properties: {
            userCount: {type: 'number'},
            fileCount: {type: 'number'},
          }
        }
      }
    },
  })
  async stats() {
    // return {message: 'Stats'};
    const userCount = await this.userRepository.count();
    const fileCount = await this.tableMetadataRepository.count();
    return {userCount: userCount.count, fileCount: fileCount.count};
  }



}
