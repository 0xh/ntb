import Document from './Document';


export default class MunicipalityToHazardRegion extends Document {
  static tableName = 'municipalitiesToHazardRegions';
  static idColumn = ['municipalityId', 'hazardRegionId'];

  // Database columns
  readonly municipalityId!: string;
  readonly hazardRegionId!: string;
  processedVerified?: Date;
}
