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
    const csvContent = readFileSync(filePath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    if (existingFormat) {
      return {
        dataFormat: existingFormat,
        sanitizedData: records,
      };
    }

    // Generate data format from CSV headers
    const dataFormat = this.generateDataFormat(records[0]);

    return {
      dataFormat,
      sanitizedData: records,
    };
  }

  private generateDataFormat(firstRow: object): object {
    const format: any = {};

    for (const key of Object.keys(firstRow)) {
      const parts = key.split('_');
      let currentLevel = format;

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
