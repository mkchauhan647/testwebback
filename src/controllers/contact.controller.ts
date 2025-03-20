import {repository} from '@loopback/repository';
import {del, get, param, patch, post, requestBody} from '@loopback/rest';
import {Contact} from '../models';
import {ContactRepository} from '../repositories';

export class ContactController {
  constructor(
    @repository(ContactRepository)
    public contactRepository: ContactRepository,
  ) { }

  // Add new contact information
  @post('/contacts')
  async create(@requestBody() contact: Contact): Promise<Contact> {

    // return this.contactRepository.createAll(contacts);

    return this.contactRepository.create({
      ...contact, tenantId: contact.tenantId || 1
    });
  }

  // Get all contact information
  @get('/contacts')
  async find(): Promise<Contact[]> {
    return this.contactRepository.find();
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
