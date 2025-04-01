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

    const files = req.files;


    // console.log("files", req.files, req.logoFile1, req.logoFile2, req.logoFile3);

    // console.log("body", req.body);

    // return;


    const footer = JSON.parse(req.body.footer);
    // const footer = req.body.footer;

    console.log("file", footer);

    if (!files) throw new Error('File is required');

    let urls = [];


    for (const file of files) {
      const tempPath = path.join(tmpdir(), `${Date.now()}-${file.originalname}`);

      writeFileSync(tempPath, file.buffer);

      const key = `uploaded-files/${Date.now()}-${file.originalname}`;

      const s3Url = await this.s3Service.uploadFile(tempPath, key);
      urls.push({
        name: file.originalname,
        url: s3Url
      });
    }



    return this.footerRepository.create({
      ...footer, logo1: {name: req.body?.logo1 || urls[0].name, url: urls[0]}, logo2: {name: req.body?.logo2 || urls[1].name, url: urls[1]}, logo3: {name: req.body?.logo3 || urls[2].name, url: urls[2]}, tenantId: footer.tenantId || 1
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
    @requestBody.file()
    req: any
  ): Promise<void> {

    const files = req.files;

    let footer;


    const existingFooter = await this.footerRepository.findById(id);

    if (!existingFooter) {
      throw new Error("Footer not found");
    }

    if (req.body) {

      console.log("req.body", req.body);

      footer = req.body
    }

    if (!files) {
      throw new Error('File is required');
    }


    let urls = [];

    for (const file of files) {

      console.log("file", file);
      if (file) {

        const tempPath = path.join(tmpdir(), `${Date.now()}-${file?.originalname}`);

        writeFileSync(tempPath, file.buffer);

        const key = `uploaded-files/${Date.now()}-${file.originalname}`;

        const s3Url = await this.s3Service.uploadFile(tempPath, key);

        console.log("s3Url", s3Url);


        // if (!footer) {

        let updateKey = file.fieldname === 'logoFile1' ? 'logo1' : file.fieldname === 'logoFile2' ? 'logo2' : 'logo3';

        await this.footerRepository.updateById(id, {
          [updateKey]: {
            name: file.originalname,
            url: s3Url
          }
        });


        // return;
        // } else {
        //   await this.footerRepository.updateById(id, {
        //     ...footer, logoUrl: s3Url
        //   });

        //   // return;
        // }

        // let existingKey = `uploaded-files/${existingFooter[fileKey] as {name: string, url: string} ?.url?.split('/').pop()}`;
        let existingKey;
        if (file.fieldname === 'logoFile1') {
          existingKey = `uploaded-files/${existingFooter.logo1?.url?.split('/').pop()}`;
        }
        else if (file.fieldname === 'logoFile2') {
          existingKey = `uploaded-files/${existingFooter.logo2?.url?.split('/').pop()}`;
        }
        else if (file.fieldname === 'logoFile3') {
          existingKey = `uploaded-files/${existingFooter.logo3?.url?.split('/').pop()}`;
        }
        console.log("existingKey", existingKey);

        if (existingKey) {
          await this.s3Service.deleteFile(existingKey);
        }
      }
    }




    if (footer) {
      await this.footerRepository.updateById(id, footer);
    }
  }

  // Delete a footer
  @del('/footers/{id}')
  async deleteById(@param.path.number('id') id: number): Promise<void> {


    const footer = await this.footerRepository.findById(id);


    if (!footer) {
      throw new Error("File not found");
    }

    try {


      for (const logo of [footer.logo1, footer.logo2, footer.logo3]) {
        if (logo) {
          const filename = logo?.url?.split('/').pop();
          const key = `uploaded-files/${filename}`;
          await this.s3Service.deleteFile(key);

        }
      };
      await this.footerRepository.deleteById(id);
    }
    catch (error) {
      console.log("error", error);
      throw new Error(error.message || "Error deleting file");
    }


  }


}

