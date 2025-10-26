import type { StoragePort } from "../../ports/storage.port";

export class FakeStorage implements StoragePort {
  private store = new Map<string, string>();

  async put(refId: string, content: string): Promise<void> {
    this.store.set(refId, content);
  }

  async get(refId: string): Promise<string | null> {
    return this.store.get(refId) ?? null;
  }

  async exists(refId: string): Promise<boolean> {
    return this.store.has(refId);
  }

  reset(): void {
    this.store.clear();
  }
}
