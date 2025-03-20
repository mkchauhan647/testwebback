// src/controllers/footer.controller.ts
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  del,
  get,
  param,
  patch,
  post,
  requestBody
} from '@loopback/rest';
import {writeFileSync} from 'fs';
import {tmpdir} from 'os';
import path from 'path';
import {Footer} from '../models';
import {FooterRepository} from '../repositories';
import {S3Service} from '../services/s3-service.service';

export class FooterController {
  constructor(
    @repository(FooterRepository)
    public footerRepository: FooterRepository,
    @inject("services.S3Service")
    private s3Service: S3Service,
  ) { }

  // Add a new footer
  @post('/footers')
  async create(
    @requestBody.file()
    req: any
  ): Promise<Footer | any> {

    const file = req.file;
    const footer = JSON.parse(req.body.footer);
    // const footer = req.body.footer;

    console.log("file", footer);

    if (!file) throw new Error('File is required');


    const tempPath = path.join(tmpdir(), `${Date.now()}-${file.originalname}`);

    writeFileSync(tempPath, file.buffer);

    const key = `uploaded-files/${Date.now()}-${file.originalname}`;

    const s3Url = await this.s3Service.uploadFile(tempPath, key);



    return this.footerRepository.create({
      ...footer, logoUrl: s3Url, tenantId: footer.tenantId || 1
    });
  }

  // Get all footers
  @get('/footers')
  async find(): Promise<Footer[]> {
    return this.footerRepository.find();
  }

  // Get a footer by id
  @get('/footers/{id}')
  async findById(@param.path.number('id') id: number): Promise<Footer> {
    return this.footerRepository.findById(id);
  }

  // Edit a footer
  @patch('/footers/{id}')
  async updateById(
    @param.path.number('id') id: number,
    // @requestBody() footer: Footer,
    @requestBody.file()
    req: any
  ): Promise<void> {

    const file = req.file;

    let footer;


    const existingFooter = await this.footerRepository.findById(id);

    if (!existingFooter) {
      throw new Error("Footer not found");
    }

    if (req.body.length > 0) {

      console.log("req.body", req.body);

      footer = JSON.parse(req.body);
    }



    if (file) {



      const tempPath = path.join(tmpdir(), `${Date.now()}-${file.originalname}`);

      writeFileSync(tempPath, file.buffer);

      const key = `uploaded-files/${Date.now()}-${file.originalname}`;

      const s3Url = await this.s3Service.uploadFile(tempPath, key);


      if (!footer) {

        await this.footerRepository.updateById(id, {logoUrl: s3Url});


        // return;
      } else {
        await this.footerRepository.updateById(id, {
          ...footer, logoUrl: s3Url
        });

        // return;
      }

      let existingKey = `uploaded-files/${existingFooter.logoUrl?.split('/').pop()}`;

      await this.s3Service.deleteFile(existingKey);
      return;
    }

    await this.footerRepository.updateById(id, footer);
  }

  // Delete a footer
  @del('/footers/{id}')
  async deleteById(@param.path.number('id') id: number): Promise<void> {


    const footer = await this.footerRepository.findById(id);

    console.log("logourl", footer.logoUrl);

    if (!footer) {
      throw new Error("File not found");
    }

    const filename = footer?.logoUrl?.split('/').pop();

    const key = `uploaded-files/${filename}`;

    try {
      await this.s3Service.deleteFile(key);

      await this.footerRepository.deleteById(id);
    }
    catch (error) {
      console.log("error", error);
      throw new Error(error.message || "Error deleting file");
    }


  }


}

