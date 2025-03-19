import {inject} from '@loopback/core';
import {parse} from 'fast-csv';
import fs from 'fs';
import {OperationaldbDataSource} from '../datasources';

export class CSVParserService {
  constructor(@inject('datasources.operationaldb') private dataSource: OperationaldbDataSource) { }

  async parseCSVAndSaveToDB(filePath: string) {
    return new Promise<void>((resolve, reject) => {
      const rows: any[] = [];
      let mainHeaders: string[] = [];
      let subHeaders: string[] = [];
      let headers: string[] = [];
      let isMultiLevelHeader = false;
      const tableName = `table_${Date.now()}`;

      fs.createReadStream(filePath)
        .pipe(parse({headers: false}))
        .on('data', (row: any, rowIndex: any) => {
          if (rowIndex === 0) {
            // First row always contains main headers
            mainHeaders = row.map((col: any) => col.trim().replace(/\s+/g, '_').toLowerCase());
          } else if (rowIndex === 1) {
            // Check if second row has actual sub-headers (not just empty or missing)
            const hasSubHeaders = row.some((col: any) => col && col.trim() !== '');
            if (hasSubHeaders) {
              isMultiLevelHeader = true;
              subHeaders = row.map((col: any) => col.trim().replace(/\s+/g, '_').toLowerCase());
              headers = mainHeaders.map((main, i) => (subHeaders[i] ? `${main}_${subHeaders[i]}` : main));
            } else {
              // If no valid sub-headers, treat this as the first data row
              headers = mainHeaders;
              rows.push(Object.fromEntries(mainHeaders.map((col, i) => [col, row[i] || ''])));
            }
            this.createTableIfNotExists(tableName, headers);
          } else {
            // Process normal data rows
            const formattedRow: any = {};
            headers.forEach((col, index) => {
              formattedRow[col] = row[index] || '';
            });
            rows.push(formattedRow);
          }
        })
        .on('end', async () => {
          await this.insertDataIntoTable(tableName, headers, rows);
          resolve();
        })
        .on('error', err => reject(err));
    });
  }

  async createTableIfNotExists(tableName: string, columns: string[]) {
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns
      .map(col => `"${col}" TEXT`)
      .join(', ')});`;
    await this.dataSource.execute(query);
  }

  async insertDataIntoTable(tableName: string, columns: string[], rows: any[]) {
    for (const row of rows) {
      const values = columns.map(col => row[col] || '');
      const placeholders = columns.map(() => '?').join(', ');
      const query = `INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
      await this.dataSource.execute(query, values);
    }
  }




  async parseCSVAndReturnJSON(filePath: string) {
    return new Promise<any>((resolve, reject) => {
      const rows: any[] = [];
      let mainHeaders: string[] = [];
      let subHeaders: string[] = [];
      let headers: string[] = [];
      let isMultiLevelHeader = false;

      fs.createReadStream(filePath)
        .pipe(parse({headers: false}))
        .on('data', (row: any, rowIndex: number) => {
          if (rowIndex === 0) {
            // First row is always main headers
            mainHeaders = row.map((col: any) => col.trim().replace(/\s+/g, '_').toLowerCase());
          } else if (rowIndex === 1) {
            // Check if there are valid sub-headers
            const hasSubHeaders = row.some((col: any) => col && col.trim() !== '');
            if (hasSubHeaders) {
              isMultiLevelHeader = true;
              subHeaders = row.map((col: any) => col.trim().replace(/\s+/g, '_').toLowerCase());
              headers = mainHeaders.map((main, i) => (subHeaders[i] ? `${main}_${subHeaders[i]}` : main));
            } else {
              // If no sub-headers, treat this as data and use mainHeaders
              headers = mainHeaders;
              rows.push(Object.fromEntries(mainHeaders.map((col, i) => [col, row[i] || ''])));
            }
          } else {
            // Process normal rows
            const formattedRow: any = {};
            headers.forEach((col, index) => {
              formattedRow[col] = row[index] || '';
            });
            rows.push(formattedRow);
          }
        })
        .on('end', () => {
          // Structure JSON properly
          const structuredData = this.formatStructuredJSON(mainHeaders, subHeaders, rows, isMultiLevelHeader);
          resolve(structuredData);
        })
        .on('error', err => reject(err));
    });
  }

  formatStructuredJSON(mainHeaders: string[], subHeaders: string[], rows: any[], isMultiLevel: boolean) {
    if (!isMultiLevel) {
      return {
        headers: mainHeaders,
        data: rows,
      };
    }

    let structuredHeaders: any = {};
    mainHeaders.forEach((main, index) => {
      if (subHeaders[index]) {
        if (!structuredHeaders[main]) structuredHeaders[main] = {};
        structuredHeaders[main][subHeaders[index]] = null;
      } else {
        structuredHeaders[main] = null;
      }
    });

    // Process data rows
    let structuredData = rows.map(row => {
      let structuredRow: any = {};
      Object.keys(row).forEach(key => {
        let [main, sub] = key.split('_');
        if (sub) {
          if (!structuredRow[main]) structuredRow[main] = {};
          structuredRow[main][sub] = row[key];
        } else {
          structuredRow[main] = row[key];
        }
      });
      return structuredRow;
    });

    return {
      headers: structuredHeaders,
      data: structuredData,
    };
  }

}

