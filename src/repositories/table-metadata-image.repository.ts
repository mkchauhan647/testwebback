import {Getter, inject} from '@loopback/core';
import {BelongsToAccessor, DefaultCrudRepository, repository} from '@loopback/repository';
import {ImageRepository, TableMetadataRepository} from '.';
import {OperationaldbDataSource} from '../datasources';
import {Image, TableMetadata, TableMetadataImage} from '../models';

export class TableMetadataImageRepository extends DefaultCrudRepository<
  TableMetadataImage,
  typeof TableMetadataImage.prototype.id
> {


  private tableMetadata: BelongsToAccessor<TableMetadata, typeof TableMetadata.prototype.id>;
  private image: BelongsToAccessor<Image, typeof Image.prototype.id>;


  constructor(@inject('datasources.Operationaldb') dataSource: OperationaldbDataSource,

    @repository.getter('TableMetadataRepository')
    protected tableMetadataRepositoryGetter: Getter<TableMetadataRepository>,
    @repository.getter('ImageRepository')
    protected imageRepositoryGetter: Getter<ImageRepository>,


  ) {
    super(TableMetadataImage, dataSource);


    this.tableMetadata = this.createBelongsToAccessorFor('tableMetadata', tableMetadataRepositoryGetter);
    this.image = this.createBelongsToAccessorFor('image', imageRepositoryGetter);
    this.registerInclusionResolver('tableMetadata', this.tableMetadata.inclusionResolver);
    this.registerInclusionResolver('image', this.image.inclusionResolver);


  }
}
