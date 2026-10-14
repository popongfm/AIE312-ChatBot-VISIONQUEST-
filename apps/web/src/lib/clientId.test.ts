import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { __resetClientIdForTests, getClientId } from './clientId';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('getClientId', () => {
  beforeEach(() => {
    localStorage.clear();
    __resetClientIdForTests();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('is stable and persisted under vq.clientId', () => {
    const a = getClientId();
    expect(a).toMatch(UUID);
    expect(getClientId()).toBe(a);
    expect(localStorage.getItem('vq.clientId')).toBe(a);
    __resetClientIdForTests();
    expect(getClientId()).toBe(a);
  });

  test('replaces an invalid stored value', () => {
    localStorage.setItem('vq.clientId', 'not-a-uuid');
    const id = getClientId();
    expect(id).toMatch(UUID);
    expect(localStorage.getItem('vq.clientId')).toBe(id);
  });

  test('survives storage errors with a stable session uuid', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const id = getClientId();
    expect(id).toMatch(UUID);
    expect(getClientId()).toBe(id);
  });
});
