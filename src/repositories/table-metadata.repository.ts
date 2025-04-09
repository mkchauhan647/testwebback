import {Getter, inject} from '@loopback/core';
import {DefaultCrudRepository, HasManyThroughRepositoryFactory, repository} from '@loopback/repository';
import {OperationaldbDataSource} from '../datasources';
import {Image, TableMetadata} from '../models';
import {ImageRepository} from './image.repository';
import {TableMetadataImageRepository} from './table-metadata-image.repository';

export class TableMetadataRepository extends DefaultCrudRepository<
  TableMetadata,
  typeof TableMetadata.prototype.id
> {

  public readonly images: HasManyThroughRepositoryFactory<
    Image,
    typeof Image.prototype.id,
    TableMetadata,
    typeof TableMetadata.prototype.id
  >;


  constructor(
    @inject('datasources.Operationaldb') dataSource: OperationaldbDataSource,
    @repository.getter('ImageRepository')
    protected imageRepositoryGetter: Getter<ImageRepository>,
    @repository.getter('TableMetadataImageRepository')
    protected tableMetadataImageRepositoryGetter: Getter<TableMetadataImageRepository>,
  ) {
    super(TableMetadata, dataSource);

    this.images = this.createHasManyThroughRepositoryFactoryFor(
      'images',
      imageRepositoryGetter,
      tableMetadataImageRepositoryGetter,
    );

    this.registerInclusionResolver('images', this.images.inclusionResolver);
  }

  // Method to find by table name
  async findByTableName(tableName: string): Promise<TableMetadata | null> {
    return this.findOne({where: {tableName}});
  }
}
