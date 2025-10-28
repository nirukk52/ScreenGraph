import { Bucket } from "encore.dev/storage/objects";

/**
 * artifactsBucket defines the object storage location for agent artifacts.
 * PURPOSE: Central, typed resource for uploads/downloads by the service.
 */
export const artifactsBucket = new Bucket("artifacts");


