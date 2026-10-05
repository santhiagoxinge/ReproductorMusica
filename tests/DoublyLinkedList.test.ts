import { describe, it, expect, beforeEach } from 'vitest';
import { DoublyLinkedList } from '../frontend/src/data-structures/DoublyLinkedList';
import { Song } from '../frontend/src/models/Song';

describe('DoublyLinkedList Core Data Structure', () => {
  let list: DoublyLinkedList<Song>;

  const createSampleSong = (id: string, title: string): Song => ({
    id,
    title,
    artist: `Artist ${id}`,
    album: `Album ${id}`,
    duration: 180,
    coverUrl: `/assets/covers/cover_1.png`,
    audioUrl: `/assets/audio/song_1.wav`
  });

  beforeEach(() => {
    list = new DoublyLinkedList<Song>();
  });

  // 1. Empty list
  it('1. should initialize an empty list with null head, tail, current, and size 0', () => {
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
    expect(list.current).toBeNull();
    expect(list.getSize()).toBe(0);
    expect(list.validateIntegrity()).toBe(true);
  });

  // 2. Insert at beginning
  it('2. should insert nodes at the beginning properly updating head and pointers', () => {
    const s1 = createSampleSong('1', 'Song 1');
    const s2 = createSampleSong('2', 'Song 2');

    list.insertAtBeginning(s1);
    expect(list.head?.data.id).toBe('1');
    expect(list.tail?.data.id).toBe('1');
    expect(list.current?.data.id).toBe('1');
    expect(list.getSize()).toBe(1);

    list.insertAtBeginning(s2);
    expect(list.head?.data.id).toBe('2');
    expect(list.head?.next?.data.id).toBe('1');
    expect(list.head?.previous).toBeNull();
    expect(list.tail?.data.id).toBe('1');
    expect(list.tail?.previous?.data.id).toBe('2');
    expect(list.tail?.next).toBeNull();
    expect(list.getSize()).toBe(2);
    expect(list.validateIntegrity()).toBe(true);
  });

  // 3. Insert at end
  it('3. should insert nodes at the end properly updating tail and pointers', () => {
    const s1 = createSampleSong('1', 'Song 1');
    const s2 = createSampleSong('2', 'Song 2');
    const s3 = createSampleSong('3', 'Song 3');

    list.insertAtEnd(s1);
    list.insertAtEnd(s2);
    list.insertAtEnd(s3);

    expect(list.head?.data.id).toBe('1');
    expect(list.tail?.data.id).toBe('3');
    expect(list.getSize()).toBe(3);
    expect(list.head?.next?.data.id).toBe('2');
    expect(list.tail?.previous?.data.id).toBe('2');
    expect(list.validateIntegrity()).toBe(true);
  });

  // 4. Insert at position
  it('4. should insert node at specific position in the middle', () => {
    const s1 = createSampleSong('1', 'Song 1');
    const s2 = createSampleSong('2', 'Song 2');
    const sNew = createSampleSong('1.5', 'Song 1.5');

    list.insertAtEnd(s1);
    list.insertAtEnd(s2);
    list.insertAtPosition(1, sNew);

    expect(list.getSize()).toBe(3);
    const middle = list.getNodeAt(1);
    expect(middle?.data.id).toBe('1.5');
    expect(middle?.previous?.data.id).toBe('1');
    expect(middle?.next?.data.id).toBe('2');
    expect(list.validateIntegrity()).toBe(true);
  });

  // 5. Delete head
  it('5. should delete head node and update pointers correctly', () => {
    const s1 = createSampleSong('1', 'Song 1');
    const s2 = createSampleSong('2', 'Song 2');
    list.insertAtEnd(s1);
    list.insertAtEnd(s2);

    const deleted = list.delete('1');
    expect(deleted).toBe(true);
    expect(list.head?.data.id).toBe('2');
    expect(list.head?.previous).toBeNull();
    expect(list.tail?.data.id).toBe('2');
    expect(list.getSize()).toBe(1);
    expect(list.validateIntegrity()).toBe(true);
  });

  // 6. Delete tail
  it('6. should delete tail node and update previous tail next pointer', () => {
    const s1 = createSampleSong('1', 'Song 1');
    const s2 = createSampleSong('2', 'Song 2');
    list.insertAtEnd(s1);
    list.insertAtEnd(s2);

    const deleted = list.delete('2');
    expect(deleted).toBe(true);
    expect(list.tail?.data.id).toBe('1');
    expect(list.tail?.next).toBeNull();
    expect(list.getSize()).toBe(1);
    expect(list.validateIntegrity()).toBe(true);
  });

  // 7. Delete middle
  it('7. should delete middle node and connect adjacent nodes directly', () => {
    const s1 = createSampleSong('1', 'Song 1');
    const s2 = createSampleSong('2', 'Song 2');
    const s3 = createSampleSong('3', 'Song 3');
    list.insertAtEnd(s1);
    list.insertAtEnd(s2);
    list.insertAtEnd(s3);

    const deleted = list.delete('2');
    expect(deleted).toBe(true);
    expect(list.getSize()).toBe(2);
    expect(list.head?.next?.data.id).toBe('3');
    expect(list.tail?.previous?.data.id).toBe('1');
    expect(list.validateIntegrity()).toBe(true);
  });

  // 8. Move next
  it('8. should move current pointer forward using current.next', () => {
    const s1 = createSampleSong('1', 'Song 1');
    const s2 = createSampleSong('2', 'Song 2');
    list.insertAtEnd(s1);
    list.insertAtEnd(s2);

    expect(list.current?.data.id).toBe('1');
    const nextNode = list.moveNext();
    expect(nextNode?.data.id).toBe('2');
    expect(list.current?.data.id).toBe('2');

    // Attempting next past tail returns null
    const beyondTail = list.moveNext();
    expect(beyondTail).toBeNull();
    expect(list.current?.data.id).toBe('2');
  });

  // 9. Move previous
  it('9. should move current pointer backward using current.previous', () => {
    const s1 = createSampleSong('1', 'Song 1');
    const s2 = createSampleSong('2', 'Song 2');
    list.insertAtEnd(s1);
    list.insertAtEnd(s2);

    list.moveNext(); // At Song 2
    expect(list.current?.data.id).toBe('2');

    const prevNode = list.movePrevious();
    expect(prevNode?.data.id).toBe('1');
    expect(list.current?.data.id).toBe('1');

    // Attempting previous before head returns null
    const beforeHead = list.movePrevious();
    expect(beforeHead).toBeNull();
    expect(list.current?.data.id).toBe('1');
  });

  // 10. Head and tail consistency
  it('10. should maintain head and tail consistency on single and multi-element operations', () => {
    const s1 = createSampleSong('1', 'Song 1');
    list.insertAtBeginning(s1);
    expect(list.head).toBe(list.tail);

    list.delete('1');
    expect(list.head).toBeNull();
    expect(list.tail).toBeNull();
  });

  // 11. Previous pointer consistency
  it('11. should ensure all previous pointers point to their actual predecessor', () => {
    for (let i = 1; i <= 5; i++) {
      list.insertAtEnd(createSampleSong(String(i), `Song ${i}`));
    }

    let node = list.tail;
    for (let i = 5; i >= 1; i--) {
      expect(node?.data.id).toBe(String(i));
      node = node?.previous || null;
    }
    expect(node).toBeNull();
    expect(list.validateIntegrity()).toBe(true);
  });

  // 12. Next pointer consistency
  it('12. should ensure all next pointers point to their actual successor', () => {
    for (let i = 1; i <= 5; i++) {
      list.insertAtEnd(createSampleSong(String(i), `Song ${i}`));
    }

    let node = list.head;
    for (let i = 1; i <= 5; i++) {
      expect(node?.data.id).toBe(String(i));
      node = node?.next || null;
    }
    expect(node).toBeNull();
    expect(list.validateIntegrity()).toBe(true);
  });

  // 13. Shuffle
  it('13. should physically rearrange pointers during shuffle and keep list valid', () => {
    for (let i = 1; i <= 10; i++) {
      list.insertAtEnd(createSampleSong(String(i), `Song ${i}`));
    }
    const currentBefore = list.current?.data.id;

    list.shuffle();

    expect(list.getSize()).toBe(10);
    expect(list.validateIntegrity()).toBe(true);
    expect(list.current?.data.id).toBe(currentBefore);
    expect(list.head?.previous).toBeNull();
    expect(list.tail?.next).toBeNull();
  });

  // 14. Reorder
  it('14. should correctly reorder nodes and update all pointers', () => {
    for (let i = 1; i <= 4; i++) {
      list.insertAtEnd(createSampleSong(String(i), `Song ${i}`));
    }
    // List: 1 <-> 2 <-> 3 <-> 4
    // Move Song 4 (index 3) before Song 2 (index 1) -> 1 <-> 4 <-> 2 <-> 3
    const success = list.reorder(3, 1);
    expect(success).toBe(true);

    const titles = list.toArray().map((s) => s.id);
    expect(titles).toEqual(['1', '4', '2', '3']);
    expect(list.validateIntegrity()).toBe(true);
  });

  // 15. Repeated navigation
  it('15. should handle repeated back-and-forth navigation seamlessly', () => {
    for (let i = 1; i <= 4; i++) {
      list.insertAtEnd(createSampleSong(String(i), `Song ${i}`));
    }

    // Traverse forward to end
    expect(list.current?.data.id).toBe('1');
    list.moveNext(); // 2
    list.moveNext(); // 3
    list.moveNext(); // 4
    expect(list.current?.data.id).toBe('4');
    expect(list.moveNext()).toBeNull(); // Bound check

    // Traverse backward to start
    list.movePrevious(); // 3
    list.movePrevious(); // 2
    list.movePrevious(); // 1
    expect(list.current?.data.id).toBe('1');
    expect(list.movePrevious()).toBeNull(); // Bound check
    expect(list.validateIntegrity()).toBe(true);
  });
});
