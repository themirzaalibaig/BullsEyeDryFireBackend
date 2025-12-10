export interface SoftDeleteType {
  isDeleted: boolean;
  deletedAt: Date | null;
}

export interface TimestampType {
  createdAt: Date;
  updatedAt: Date;
}

export interface UserTrackingType {
  createdBy: string;
  updatedBy: string;
}

export interface FullAuditType extends BaseType {
  deletedAt: Date | null;
  createdBy: string;
  updatedBy: string;
}

export interface IdentifiableType {
  _id: string;
}

export interface VersionType {
  version: number;
}

export interface MetadataType {
  metadata: Record<string, any>;
}

export interface ActiveType {
  isActive?: boolean;
}

export interface BaseType extends SoftDeleteType, TimestampType, UserTrackingType, ActiveType {}
