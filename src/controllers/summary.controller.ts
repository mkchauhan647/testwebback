import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {
  del,
  get,
  HttpErrors,
  param,
  patch,
  post,
  requestBody,
  RestBindings
} from '@loopback/rest';
import {Request} from 'express';
import {writeFileSync} from 'fs';
import {tmpdir} from 'os';
import path from 'path';
import {Summary} from '../models';
import {SummaryRepository} from '../repositories';
import {AuthService} from '../services';
import {S3Service} from '../services/s3-service.service';

export class SummaryController {
  constructor(
    @repository(SummaryRepository)
    public summaryRepository: SummaryRepository,
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject('services.S3Service') private s3Service: S3Service,
    @inject('services.AuthService') private authService: AuthService,
  ) { }

  @get('/summary', {
    responses: {
      '200': {
        description: 'Array of Summary model instances',
        content: {'application/json': {schema: {'x-ts-type': Summary}}},
      },
    },
  })
  async find(): Promise<Summary[]> {


    const tenantId = Number(await this.authService.getTenantId());


    return this.summaryRepository.find({
      where: {
        tenantId: tenantId || 1,
      }
    });
  }

  @get('/summary/{id}', {
    responses: {
      '200': {
        description: 'Summary model instance',
        content: {'application/json': {schema: {'x-ts-type': Summary}}},
      },
    },
  })
  async findById(@param.path.number('id') id: number): Promise<Summary> {
    const summary = await this.summaryRepository.findById(id);
    if (!summary) {
      throw new HttpErrors.NotFound('Summary not found');
    }
    return summary;
  }

  // // CREATE new summary
  // @post('/summary', {
  //   responses: {
  //     '201': {
  //       description: 'Summary created',
  //       content: {'application/json': {schema: {'x-ts-type': Summary}}},
  //     },
  //   },
  // })
  // async create(
  //   @requestBody({
  //     description: 'Multipart/form-data for summary creation',
  //     required: true,
  //     content: {
  //       'multipart/form-data': {
  //         'x-parser': 'stream',
  //         schema: {
  //           type: 'object', properties: {
  //             title: {type: 'string'},
  //             name: {type: 'string'},
  //             description: {type: 'string'},
  //             // file: {type: 'string', format: 'binary'},
  //           }
  //         },

  //       },
  //     },
  //   })
  //   req: any,
  // ): Promise<Summary | any> {
  //   const file = this.req.file;
  //   // const files = this.req.files;
  //   // const file = Array.isArray(files) ? files[0] : null;

  //   const body = this.req.body;

  //   console.log("file", file);
  //   console.log("body", body);

  //   if (!file) {
  //     throw new Error('File is required');
  //   }

  //   const tempPath = path.join(tmpdir(), `${Date.now()}-${file.originalname}`);
  //   writeFileSync(tempPath, file.buffer)

  //   const key = `uploaded-files/${Date.now()}-${file.originalname}`;


  //   const imageUrl = await this.s3Service.uploadFile(tempPath, key);

  //   const tenantId = Number(await this.authService.getTenantId());

  //   const summaryData = {
  //     title: body.title,
  //     name: body.name,
  //     description: body.description,
  //     imageUrl: imageUrl,
  //     tenantId: tenantId || 1,
  //   };

  //   return this.summaryRepository.create(summaryData);
  // }


  @post('/summary', {
    responses: {
      '201': {
        description: 'Summary created',
        content: {'application/json': {schema: {'x-ts-type': Summary}}},
      },
    },
  })
  async create(
    @requestBody({
      description: 'Multipart/form-data for summary creation',
      required: true,
      content: {
        'multipart/form-data': {
          'x-parser': 'stream',
          schema: {
            type: 'object',
            properties: {
              title: {type: 'string'},
              name: {type: 'string'},
              description: {type: 'string'},
              locale: {type: 'string'}, // optional locale input
              // file: {type: 'string', format: 'binary'},
            },
          },
        },
      },
    })
    req: any,
    @param.query.string('lang') lang: string,
  ): Promise<Summary | any> {
    const file = req.file;
    const body = req.body;

    if (!lang) {
      lang = 'en';
    }

    const oppositeLocale = lang === 'en' ? 'np' : 'en';

    const tenantId = Number(await this.authService.getTenantId());
    // if (isNaN(tenantId)) {
    // throw new Error('Invalid tenant ID');
    // }

    const existingSummary = await this.summaryRepository.findOne({
      where: {
        tenantId: +tenantId || 1,
        locale: lang,
      }
    });

    if (existingSummary) {
      throw new Error("Footer already exists for this tenant and locale");
    }


    let imageUrl: string | null = null;

    // ✅ Handle file upload if available
    if (file) {
      const tempPath = path.join(tmpdir(), `${Date.now()}-${file.originalname}`);
      writeFileSync(tempPath, file.buffer);

      const key = `uploaded-files/${Date.now()}-${file.originalname}`;
      imageUrl = await this.s3Service.uploadFile(tempPath, key);
    } else {
      const existingSummary = await this.summaryRepository.findOne({
        where: {
          tenantId: tenantId || 1,
          locale: oppositeLocale,
        },
      });

      if (existingSummary?.imageUrl) {
        imageUrl = existingSummary.imageUrl;
      } else {
        throw new Error('No file provided and no reusable image found from opposite locale.');
      }
    }

    const summaryData = {
      title: body.title,
      name: body.name,
      description: body.description,
      imageUrl,
      tenantId: tenantId || 1,
      locale: lang
    };

    return this.summaryRepository.create(summaryData);
  }




  @get('/summary-by-lang')
  async findSummaryByLang(
    @param.query.string('lang') lang: string
  ): Promise<Summary | null> {

    const tenantId = this.authService.getTenantId();

    console.log("tenantId", tenantId);
    console.log("lang", lang);

    const existingSummary = await this.summaryRepository.findOne({
      where: {
        tenantId: +tenantId || 1,
        locale: lang || 'en'
      }

    });

    // console.log("existingSummary", existingSummary);

    // return this.summaryRepository.findOne({
    //   where: {
    //     tenantId: +tenantId || 1,
    //     locale: lang || 'en'
    //   }
    // })

    return existingSummary;

  }




  @patch('/summary/{id}', {
    responses: {
      '204': {
        description: 'Summary updated successfully',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
  ): Promise<void> {
    // const file = this.req.files ? this.req.files[0] : null;
    const file = this.req.file;
    // const file = Array.isArray(files) ? files[0] : null;
    const body = this.req.body;

    console.log("file", file);


    const existing = await this.summaryRepository.findById(id);
    if (!existing) {
      throw new HttpErrors.NotFound('Summary not found');
    }


    let imageUrl = existing.imageUrl;

    if (file) {
      const tempPath = path.join(tmpdir(), `${Date.now()}-${file.originalname}`);
      writeFileSync(tempPath, file.buffer);
      const key = `uploaded-files/${Date.now()}-${file.originalname}`;
      imageUrl = await this.s3Service.uploadFile(tempPath, key);

      await this.s3Service.deleteFile(`uploaded-files/${existing.imageUrl?.split('/').pop()}`);
    }



    const updateData = {
      title: body?.title || existing.title,
      name: body?.name || existing.name,
      description: body?.description || existing.description,
      imageUrl: imageUrl ?? existing.imageUrl,
    };

    await this.summaryRepository.updateById(id, updateData);
  }

  @del('/summary/{id}', {
    responses: {
      '204': {
        description: 'Summary deleted successfully',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    // const exists = await this.summaryRepository.exists(id);
    const exists = await this.summaryRepository.findById(id);
    if (!exists) {
      throw new HttpErrors.NotFound('Summary not found');
    }

    const key = `uploaded-files/${exists.imageUrl?.split('/').pop()}`;

    await this.s3Service.deleteFile(key);

    await this.summaryRepository.deleteById(id);
  }
}
