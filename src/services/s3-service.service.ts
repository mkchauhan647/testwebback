import {config} from '@loopback/core';
import {S3} from 'aws-sdk';
import {readFileSync} from 'fs';

export class S3Service {
  private s3: S3;

  constructor(
    @config() private s3Config: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucket: string;
    },
  ) {
    this.s3 = new S3({
      accessKeyId: s3Config.accessKeyId,
      secretAccessKey: s3Config.secretAccessKey,
      region: s3Config.region,
    });
  }

  async uploadFile(filePath: string, key: string): Promise<string> {
    const fileContent = readFileSync(filePath);


    const params = {
      Bucket: this.s3Config.bucket,
      // Key: `csv-files/${tableName}.csv`,
      Key: key,
      Body: fileContent,
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async deleteFile(key: string): Promise<void> {
    const params = {
      Bucket: this.s3Config.bucket,
      // Key: `csv-files/${tableName}.csv`,
      Key: key
    };

    await this.s3.deleteObject(params).promise();
  }


}
