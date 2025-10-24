export interface StoragePort {
  put(refId: string, content: string): Promise<void>;
  
  get(refId: string): Promise<string | null>;
  
  exists(refId: string): Promise<boolean>;
}
