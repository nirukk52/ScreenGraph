import { DomainEvent } from "../domain/events";

export class Outbox {
  private queue: DomainEvent[] = [];
  private nextSeq = 1;

  enqueue(event: DomainEvent): void {
    this.queue.push(event);
  }

  publishNext(): DomainEvent | null {
    if (this.queue.length === 0) return null;
    
    this.queue.sort((a, b) => a.sequence - b.sequence);
    
    const next = this.queue.find((e) => e.sequence === this.nextSeq);
    if (!next) return null;
    
    this.nextSeq++;
    this.queue = this.queue.filter((e) => e.sequence !== next.sequence);
    return next;
  }

  publishAll(): DomainEvent[] {
    const published: DomainEvent[] = [];
    let next = this.publishNext();
    while (next) {
      published.push(next);
      next = this.publishNext();
    }
    return published;
  }

  reset(): void {
    this.queue = [];
    this.nextSeq = 1;
  }
}
