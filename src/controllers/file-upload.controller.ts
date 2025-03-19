// import {inject} from '@loopback/core';
// import {post, requestBody} from '@loopback/rest';
// import multer from 'multer';
// import {FileUploadService} from '../services';

// export class FileUploadController {
//   constructor(
//     @inject('services.FileUploadService') private fileUploadService: FileUploadService,
//   ) { }

//   // Multer configuration
//   private multer = multer({dest: './uploads/'});

//   // File upload endpoint
//   @post('/upload')
//   uploadFile(
//     @requestBody({
//       content: {
//         'multipart/form-data': {
//           schema: {
//             type: 'object',
//             properties: {
//               file: {type: 'string', format: 'binary'},
//             },
//           },
//         },
//       },
//     })
//     request: any,
//   ) {
//     return new Promise((resolve, reject) => {
//       this.multer.single('file')(request, null, (err: any) => {
//         if (err) {
//           return reject(err);
//         }
//         resolve({message: 'File uploaded successfully!', file: request.file});
//       });
//     });
//   }
// }
