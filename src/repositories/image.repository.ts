import {Getter, inject} from '@loopback/core';
import {
  DefaultCrudRepository,
  HasManyThroughRepositoryFactory,
  repository,
} from '@loopback/repository';
import {OperationaldbDataSource} from '../datasources';
import {Image, TableMetadata, TableMetadataImage} from '../models';
import {TableMetadataImageRepository} from './table-metadata-image.repository';
import {TableMetadataRepository} from './table-metadata.repository';

export class ImageRepository extends DefaultCrudRepository<
  Image,
  typeof Image.prototype.id
> {
  public readonly tableMetadata: HasManyThroughRepositoryFactory<
    TableMetadata,
    typeof Image.prototype.id,
    TableMetadataImage,
    typeof TableMetadata.prototype.id
  >;

  constructor(
    @inject('datasources.Operationaldb') dataSource: OperationaldbDataSource,
    @repository.getter('TableMetadataRepository')
    protected tableMetadataRepositoryGetter: Getter<TableMetadataRepository>,
    @repository.getter('TableMetadataImageRepository')
    protected tableMetadataImageRepositoryGetter: Getter<TableMetadataImageRepository>,
  ) {
    super(Image, dataSource);

    this.tableMetadata = this.createHasManyThroughRepositoryFactoryFor(
      'tableMetadata',
      tableMetadataRepositoryGetter,
      tableMetadataImageRepositoryGetter,
    );

    this.registerInclusionResolver(
      'tableMetadata',
      this.tableMetadata.inclusionResolver,
    );
  }
}
