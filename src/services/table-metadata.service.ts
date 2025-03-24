import {inject} from '@loopback/core';
import {DataSource} from '@loopback/repository';
import csvParser from 'csv-parser';
import {TableMetadata} from '../models/table-metadata.model';

export class TableMetadataService {
  constructor(
    @inject('datasources.operationaldb') private dataSource: DataSource,
  ) { }

  async createTableBasedOnMetadata(tableMetadata: TableMetadata): Promise<void> {
    const {tableName, dataFormat} = tableMetadata;

    if (!tableName || !dataFormat) {
      throw new Error('Table name and data format are required to create a table');
    }

    let createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (id SERIAL PRIMARY KEY`;

    for (const [column, subColumns] of Object.entries(dataFormat)) {
      if (typeof subColumns === 'object') {
        for (const subColumn of Object.keys(subColumns)) {
          createTableQuery += `, ${column}_${subColumn} TEXT`;
        }
      } else {
        createTableQuery += `, ${column} TEXT`;
      }
    }

    createTableQuery += `);`;

    await this.dataSource.execute(createTableQuery);
  }

  async saveCSVDataToTable(tableName: string, csvData: any[]): Promise<void> {
    const insertPromises = csvData.map(async (row) => {
      const columns = Object.keys(row).join(', ');
      const values = Object.values(row).map(value => `'${value}'`).join(', ');

      const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`;

      await this.dataSource.execute(insertQuery);
    });

    await Promise.all(insertPromises);
  }

  flattenCSVData(csvData: any[], dataFormat: any): any[] {
    return csvData.map((data) => {
      const flattened: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object') {
          for (const [subKey, subValue] of Object.entries(value || {})) {
            flattened[`${key}_${subKey}`] = subValue;
          }
        } else {
          flattened[key] = value;
        }
      }
      return flattened;
    });
  }

  async parseCSV(fileStream: any): Promise<any[]> {
    const csvData = await this.parseCSVFile(fileStream);
    return this.flattenCSVData(csvData, {});
  }

  private parseCSVFile(fileStream: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const result: any[] = [];
      fileStream.pipe(csvParser())
        .on('data', (row: any) => result.push(row))
        .on('end', () => resolve(result))
        .on('error', (error: any) => reject(error));
    });
  }
}
