import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {del, get, param, post, requestBody} from '@loopback/rest';
import * as fs from 'fs';
import {tmpdir} from 'os';
import * as path from 'path';
import {FileManagement} from '../models';
import {FileManagementRepository} from '../repositories';
import {S3Service} from '../services/s3-service.service';

export class FileManagementController {
  constructor(
    @repository(FileManagementRepository)
    public fileRepository: FileManagementRepository,
    @inject("services.S3Service")
    private s3Service: S3Service,
  ) { }

  // Upload a file
  @post('/files')
  async upload(
    @requestBody.file()
    request: any
  ): Promise<FileManagement | any> {
    const files = request.files;
    const file = Array.isArray(files) ? files[0] : files;
    if (!file) throw new Error('File is required');

    const tempPath = path.join(tmpdir(), `${Date.now()}-${file.originalname}`);

    fs.writeFileSync(tempPath, file.buffer);

    const key = `uploaded-files/${Date.now()}-${file.originalname}`;

    console.log("key", key);



    const s3Url = await this.s3Service.uploadFile(tempPath, key);


    // Save file record in database
    const newFile = new FileManagement({
      filename: file.originalname,
      url: s3Url,
      fileSize: file.size
    });

    return this.fileRepository.create(newFile);
  }

  // Get all files
  @get('/files')
  async find(): Promise<FileManagement[]> {
    return this.fileRepository.find();
  }

  // Get a file by id
  @get('/files/{id}')
  async findById(@param.path.number('id') id: number): Promise<FileManagement> {
    return this.fileRepository.findById(id);
  }

  // Delete a file
  @del('/files/{id}')
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    const file = await this.fileRepository.findById(id);

    console.log("fileurl", file.url);

    if (!file) {
      throw new Error("File not found");
    }

    const filename = file.url.split('/').pop();

    const key = `uploaded-files/${filename}`;

    try {
      await this.s3Service.deleteFile(key);

      await this.fileRepository.deleteById(id);
    }
    catch (error) {
      console.log("error", error);
      throw new Error(error.message || "Error deleting file");
    }


  }
}
