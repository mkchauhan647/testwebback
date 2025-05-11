import {parse} from 'csv-parse/sync';
import {readFileSync} from 'fs';

export interface CsvProcessingResult {
  dataFormat: object;
  sanitizedData: object[];
}

export class CsvProcessorService {
  async processCsv(
    filePath: string,
    existingFormat?: object,
  ): Promise<CsvProcessingResult> {

    console.log("existingformat", existingFormat);


    // const csvContent = readFileSync(filePath, 'utf-8');

    const csvContent = readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });



    // const rawRecords = parse(csvContent, {
    //   columns: true,
    //   skip_empty_lines: true,
    // });

    // const records = rawRecords.map((record: any) => {
    //   const cleaned: any = {};
    //   for (const key in record) {
    //     const cleanKey = key.replace(/^\uFEFF/, '');
    //     cleaned[cleanKey] = record[key];
    //   }
    //   return cleaned;
    // });



    if (existingFormat) {
      return {
        dataFormat: existingFormat,
        sanitizedData: records,
      };
    }

    // Generate data format from CSV headers
    console.log("records", records);
    const dataFormat = this.generateDataFormat(records[0]);

    console.log("dataformatfromcsv", dataFormat);

    return {
      dataFormat,
      sanitizedData: records,
    };
  }

  // private generateDataFormat(firstRow: object): object {
  //   const format: any = {};

  //   for (const key of Object.keys(firstRow)) {
  //     const parts = key.split('_');
  //     let currentLevel = format;

  //     for (let i = 0; i < parts.length; i++) {
  //       const part = parts[i];
  //       if (!currentLevel[part]) {
  //         currentLevel[part] = i === parts.length - 1 ? null : {};
  //       }
  //       currentLevel = currentLevel[part];
  //     }
  //   }

  //   return format;
  // }

  private generateDataFormat(firstRow: object): object {
    const format: any = {};

    for (const key of Object.keys(firstRow)) {
      let currentLevel = format;
      const parts = [key]; // Treat the entire key as a single part

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!currentLevel[part]) {
          currentLevel[part] = i === parts.length - 1 ? null : {};
        }
        currentLevel = currentLevel[part];
      }
    }

    return format;
  }

}
