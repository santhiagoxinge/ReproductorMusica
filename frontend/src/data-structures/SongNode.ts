/**
 * SongNode<T>
 * Generic doubly linked list node.
 * Stores data and explicit references to the previous and next nodes.
 */
export class SongNode<T> {
  public data: T;
  public previous: SongNode<T> | null = null;
  public next: SongNode<T> | null = null;
  public readonly id: string;

  constructor(data: T, id?: string) {
    this.data = data;
    // Use existing id if data has one, otherwise generate or use provided
    const potentialId = (data as unknown as { id?: string })?.id;
    this.id = id || potentialId || `node-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Helper to inspect node pointers for debugging and visual explanation.
   */
  public toDebugString(): string {
    const prevId = this.previous ? this.previous.id : 'null';
    const nextId = this.next ? this.next.id : 'null';
    return `[Node: ${this.id}] (Prev: ${prevId} <-> Next: ${nextId})`;
  }
}
