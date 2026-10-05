import { SongNode } from './SongNode';

/**
 * DoublyLinkedList<T>
 * Core generic data structure for playlist management and navigation.
 * All operations maintain pointer integrity for both previous and next.
 */
export class DoublyLinkedList<T> {
  public head: SongNode<T> | null = null;
  public tail: SongNode<T> | null = null;
  public current: SongNode<T> | null = null;
  private size: number = 0;

  /**
   * Inserts a new node at the beginning of the doubly linked list (as HEAD).
   * Time complexity: O(1)
   */
  public insertAtBeginning(data: T): SongNode<T> {
    const newNode = new SongNode<T>(data);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
    } else {
      newNode.next = this.head;
      this.head.previous = newNode;
      this.head = newNode;
    }

    this.size++;
    return newNode;
  }

  /**
   * Inserts a new node at the end of the doubly linked list (as TAIL).
   * Time complexity: O(1)
   */
  public insertAtEnd(data: T): SongNode<T> {
    const newNode = new SongNode<T>(data);

    if (!this.tail) {
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
    } else {
      this.tail.next = newNode;
      newNode.previous = this.tail;
      this.tail = newNode;
    }

    this.size++;
    return newNode;
  }

  /**
   * Inserts a new node at a specific zero-based index.
   * Time complexity: O(N)
   */
  public insertAtPosition(index: number, data: T): SongNode<T> {
    if (index <= 0) {
      return this.insertAtBeginning(data);
    }

    if (index >= this.size) {
      return this.insertAtEnd(data);
    }

    const newNode = new SongNode<T>(data);
    const targetNode = this.getNodeAt(index);

    if (!targetNode || !targetNode.previous) {
      return this.insertAtBeginning(data);
    }

    const prevNode = targetNode.previous;

    // Link prevNode <-> newNode <-> targetNode
    prevNode.next = newNode;
    newNode.previous = prevNode;
    newNode.next = targetNode;
    targetNode.previous = newNode;

    this.size++;
    return newNode;
  }

  /**
   * Deletes a node by its identifier or matching predicate.
   * Reconnects previous and next pointers properly.
   */
  public delete(predicateOrId: ((data: T) => boolean) | string): boolean {
    if (!this.head) {
      return false;
    }

    let nodeToDelete: SongNode<T> | null = null;

    if (typeof predicateOrId === 'string') {
      let walker: SongNode<T> | null = this.head;
      while (walker) {
        if (walker.id === predicateOrId) {
          nodeToDelete = walker;
          break;
        }
        walker = walker.next;
      }
    } else {
      let walker: SongNode<T> | null = this.head;
      while (walker) {
        if (predicateOrId(walker.data)) {
          nodeToDelete = walker;
          break;
        }
        walker = walker.next;
      }
    }

    if (!nodeToDelete) {
      return false;
    }

    // Check if nodeToDelete is current
    const isCurrent = this.current === nodeToDelete;

    // Reconnect pointers
    if (nodeToDelete === this.head && nodeToDelete === this.tail) {
      // Only 1 node
      this.head = null;
      this.tail = null;
      this.current = null;
    } else if (nodeToDelete === this.head) {
      // Deleting head
      this.head = nodeToDelete.next;
      if (this.head) {
        this.head.previous = null;
      }
      if (isCurrent) {
        this.current = this.head;
      }
    } else if (nodeToDelete === this.tail) {
      // Deleting tail
      this.tail = nodeToDelete.previous;
      if (this.tail) {
        this.tail.next = null;
      }
      if (isCurrent) {
        this.current = this.tail;
      }
    } else {
      // Middle node
      const prevNode = nodeToDelete.previous;
      const nextNode = nodeToDelete.next;

      if (prevNode) {
        prevNode.next = nextNode;
      }
      if (nextNode) {
        nextNode.previous = prevNode;
      }
      if (isCurrent) {
        this.current = nextNode || prevNode;
      }
    }

    // Clear deleted node pointers
    nodeToDelete.previous = null;
    nodeToDelete.next = null;
    this.size--;

    return true;
  }

  /**
   * Finds the first node that matches the predicate function.
   */
  public find(predicate: (data: T) => boolean): SongNode<T> | null {
    let walker = this.head;
    while (walker) {
      if (predicate(walker.data)) {
        return walker;
      }
      walker = walker.next;
    }
    return null;
  }

  /**
   * Moves the current pointer to current.next.
   * Returns the new current node, or null if no next node exists.
   */
  public moveNext(): SongNode<T> | null {
    if (!this.current || !this.current.next) {
      return null;
    }
    this.current = this.current.next;
    return this.current;
  }

  /**
   * Moves the current pointer to current.previous.
   * Returns the new current node, or null if no previous node exists.
   */
  public movePrevious(): SongNode<T> | null {
    if (!this.current || !this.current.previous) {
      return null;
    }
    this.current = this.current.previous;
    return this.current;
  }

  /**
   * Gets the current active node.
   */
  public getCurrent(): SongNode<T> | null {
    return this.current;
  }

  /**
   * Sets current node reference directly.
   */
  public setCurrent(node: SongNode<T> | null): void {
    if (!node) {
      this.current = null;
      return;
    }
    // Verify that node belongs to list
    let walker = this.head;
    while (walker) {
      if (walker === node) {
        this.current = node;
        return;
      }
      walker = walker.next;
    }
  }

  /**
   * Sets current node by id.
   */
  public setCurrentById(id: string): boolean {
    let walker = this.head;
    while (walker) {
      if (walker.id === id) {
        this.current = walker;
        return true;
      }
      walker = walker.next;
    }
    return false;
  }

  /**
   * Returns the node at the specified zero-based index.
   */
  public getNodeAt(index: number): SongNode<T> | null {
    if (index < 0 || index >= this.size || !this.head) {
      return null;
    }

    // Optimization: traverse from head or tail depending on index proximity
    if (index < this.size / 2) {
      let walker: SongNode<T> | null = this.head;
      for (let i = 0; i < index && walker; i++) {
        walker = walker.next;
      }
      return walker;
    } else {
      let walker: SongNode<T> | null = this.tail;
      for (let i = this.size - 1; i > index && walker; i--) {
        walker = walker.previous;
      }
      return walker;
    }
  }

  /**
   * Returns the index of a node, or -1 if not found.
   */
  public indexOf(node: SongNode<T>): number {
    let walker = this.head;
    let idx = 0;
    while (walker) {
      if (walker === node || walker.id === node.id) {
        return idx;
      }
      walker = walker.next;
      idx++;
    }
    return -1;
  }

  /**
   * Clears the entire list and detaches all references.
   */
  public clear(): void {
    let walker = this.head;
    while (walker) {
      const nextNode = walker.next;
      walker.previous = null;
      walker.next = null;
      walker = nextNode;
    }
    this.head = null;
    this.tail = null;
    this.current = null;
    this.size = 0;
  }

  /**
   * Converts the list items to a serializable array of data elements.
   */
  public toArray(): T[] {
    const result: T[] = [];
    let walker = this.head;
    while (walker) {
      result.push(walker.data);
      walker = walker.next;
    }
    return result;
  }

  /**
   * Returns all SongNode instances in forward order.
   */
  public getAllNodes(): SongNode<T>[] {
    const result: SongNode<T>[] = [];
    let walker = this.head;
    while (walker) {
      result.push(walker);
      walker = walker.next;
    }
    return result;
  }

  /**
   * Returns the total count of nodes.
   */
  public getSize(): number {
    return this.size;
  }

  /**
   * Shuffles the doubly linked list by physically reconnecting the nodes in random order.
   * Preserves node instances, updates previous, next, head, tail, and keeps current valid.
   */
  public shuffle(): void {
    if (this.size <= 1 || !this.head) {
      return;
    }

    const nodes = this.getAllNodes();
    const currentTarget = this.current;

    // Fisher-Yates shuffle on the node array
    for (let i = nodes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nodes[i], nodes[j]] = [nodes[j], nodes[i]];
    }

    // Reconstruct doubly linked pointers
    this.head = nodes[0];
    this.tail = nodes[nodes.length - 1];

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.previous = i > 0 ? nodes[i - 1] : null;
      node.next = i < nodes.length - 1 ? nodes[i + 1] : null;
    }

    // Maintain current
    this.current = currentTarget || this.head;
  }

  /**
   * Reorders a node from `fromIndex` to `toIndex`.
   * Unlinks the node from its current spot and re-links it into the new position.
   */
  public reorder(fromIndex: number, toIndex: number): boolean {
    if (
      fromIndex < 0 ||
      fromIndex >= this.size ||
      toIndex < 0 ||
      toIndex >= this.size ||
      fromIndex === toIndex
    ) {
      return false;
    }

    const node = this.getNodeAt(fromIndex);
    if (!node) return false;

    // 1. Unlink node from current position
    const prevNode = node.previous;
    const nextNode = node.next;

    if (prevNode) {
      prevNode.next = nextNode;
    } else {
      this.head = nextNode;
    }

    if (nextNode) {
      nextNode.previous = prevNode;
    } else {
      this.tail = prevNode;
    }

    node.previous = null;
    node.next = null;
    this.size--; // temporarily decrement for insertion logic

    // 2. Re-insert at toIndex
    if (toIndex <= 0) {
      // Insert as head
      if (!this.head) {
        this.head = node;
        this.tail = node;
      } else {
        node.next = this.head;
        this.head.previous = node;
        this.head = node;
      }
    } else if (toIndex >= this.size) {
      // Insert as tail
      if (!this.tail) {
        this.head = node;
        this.tail = node;
      } else {
        this.tail.next = node;
        node.previous = this.tail;
        this.tail = node;
      }
    } else {
      // Insert before targetNode at toIndex
      const targetNode = this.getNodeAt(toIndex);
      if (targetNode && targetNode.previous) {
        const p = targetNode.previous;
        p.next = node;
        node.previous = p;
        node.next = targetNode;
        targetNode.previous = node;
      } else if (targetNode) {
        // Target is head
        node.next = targetNode;
        targetNode.previous = node;
        this.head = node;
      }
    }

    this.size++;
    return true;
  }

  /**
   * Diagnostic validation of list integrity.
   * Ensures head.previous === null, tail.next === null,
   * and for every node: node.next.previous === node.
   */
  public validateIntegrity(): boolean {
    if (this.size === 0) {
      return this.head === null && this.tail === null;
    }
    if (!this.head || !this.tail) return false;
    if (this.head.previous !== null) return false;
    if (this.tail.next !== null) return false;

    let count = 0;
    let walker: SongNode<T> | null = this.head;
    let last: SongNode<T> | null = null;

    while (walker) {
      count++;
      if (walker.previous !== last) return false;
      if (walker.next && walker.next.previous !== walker) return false;
      last = walker;
      walker = walker.next;
    }

    return count === this.size && last === this.tail;
  }
}
