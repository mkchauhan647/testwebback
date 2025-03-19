import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';

import {AuthenticationComponent, registerAuthenticationStrategy} from '@loopback/authentication';
import {JWTAuthenticationComponent} from '@loopback/authentication-jwt';
import {AuthorizationComponent, AuthorizationTags} from '@loopback/authorization';
import multer from 'multer';
import {RoleAuthorizer} from './authorizers/user.authorizer';
import {FILE_UPLOAD_SERVICE, STORAGE_LOCATION} from './keys';
import {CsvProcessorService} from './services';
import {S3Service} from './services/s3-service.service';
import {JWTAuthenticationStrategy} from './strategies/jwt-auth.strategy';
import {MyComponent} from './testcompo';



export {ApplicationConfig};

export class GovBackendApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);
    this.component(AuthorizationComponent);

    this.component(MyComponent);

    this.get('foo').then((val) => {
      console.log('val', val);
    });


    registerAuthenticationStrategy(this, JWTAuthenticationStrategy);

    //  Add to constructor
    this.bind('services.CsvProcessorService').toClass(CsvProcessorService);
    this.bind('services.S3Service').toClass(S3Service);



    // Bind custom role authorizer
    this.bind('authorizationProviders.role-auth-provider')
      .toProvider(RoleAuthorizer)
      .tag(AuthorizationTags.AUTHORIZER);




    // Configure S3
    this.configure('services.S3Service').to({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_BUCKET,
    });


    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };
  }




  // **
  //  * Configure `multer` options for file upload
  //  */
  protected configureFileUpload(destination?: string) {
    destination = destination ?? path.join(__dirname, '../uploads');
    this.bind(STORAGE_LOCATION).to(destination);
    const multerOptions: multer.Options = {
      storage: multer.memoryStorage(),
    };
    // Configure the file upload service with multer options
    this.configure(FILE_UPLOAD_SERVICE).to(multerOptions);
  }

}
