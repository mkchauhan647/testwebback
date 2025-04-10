import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {del, get, param, patch, post, requestBody} from '@loopback/rest';
import {Contact} from '../models';
import {ContactRepository} from '../repositories';
import {AuthService} from '../services';

export class ContactController {
  constructor(
    @repository(ContactRepository)
    public contactRepository: ContactRepository,
    @inject('services.AuthService')
    public authService: AuthService
  ) { }

  // Add new contact information
  @post('/contacts')
  async create(@requestBody() contact: Contact,

    @param.query.string('lang') lang: string = 'en'
  ): Promise<Contact> {



    const oppositeLang = lang === 'en' ? 'np' : 'en';


    const tenantId = await this.authService.getTenantId();

    const existingContact = await this.contactRepository.findOne({
      where: {contactNumber: contact?.contactNumber, tenantId: contact?.tenantId || 1, locale: lang || contact?.locale}
    });

    if (existingContact) {
      throw new Error(`Contact with contactNumber ${contact?.contactNumber} already exists in ${lang} locale.`);
    }



    return this.contactRepository.create({
      ...contact, tenantId: contact.tenantId || 1, locale: lang || contact.locale || 'en'
    });

  }
  @post('/multiple-contacts')
  async createMultiple(@requestBody() contacts: Contact[],

    @param.query.string('lang') lang: string = 'en'
  ): Promise<Contact[]> {


    let contactsCreated: Contact[] = [];

    const tenantId = await this.authService.getTenantId();

    for (const contact of contacts) {
      const existingContact = await this.contactRepository.findOne({
        where: {contactNumber: contact?.contactNumber, tenantId: contact?.tenantId || 1, locale: lang || contact?.locale}
      });

      if (existingContact) {
        throw new Error(`Contact with contactNumber ${contact?.contactNumber} already exists in ${lang} locale.`);
      }



      const createdContact = await this.contactRepository.create({
        ...contact, tenantId: contact.tenantId || 1, locale: lang || contact.locale || 'en'
      });

      contactsCreated = [...contactsCreated, createdContact];
    }



    return contactsCreated;
  }

  @get('/contacts')
  async find(): Promise<Contact[]> {
    return this.contactRepository.find();
  }


  // get contacts by lang
  @get('/contacts-by-lang')
  async findByLang(
    @param.query.string('lang') lang: string = 'en',
  ): Promise<Contact[]> {


    const tenantId = await this.authService.getTenantId();


    return this.contactRepository.find({
      where: {tenantId: tenantId || 1, locale: lang}
    });
  }

  // Get a contact by id
  @get('/contacts/{id}')
  async findById(@param.path.number('id') id: number): Promise<Contact> {
    return this.contactRepository.findById(id);
  }

  // Edit contact information
  @patch('/contacts/{id}')
  async updateById(
    @param.path.number('id') id: number,
    @requestBody() contact: Partial<Contact>,
  ): Promise<void> {
    await this.contactRepository.updateById(id, contact);
  }

  // Delete contact information
  @del('/contacts/{id}')
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.contactRepository.deleteById(id);
  }
}
