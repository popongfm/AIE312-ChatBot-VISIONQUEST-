import { afterEach, expect, test, vi } from 'vitest';
import { getClientId } from './clientId';

const VALID = /^[A-Za-z0-9-]{8,64}$/; // what the API accepts in X-Client-Id

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

test('getClientId is stable and stored for the next visit', () => {
  const first = getClientId();
  expect(first).toMatch(VALID);
  expect(getClientId()).toBe(first);
  expect(localStorage.getItem('vq.clientId')).toBe(first);
});

test('getClientId survives storage errors with a session-long id', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const id = getClientId();
  expect(id).toMatch(VALID);
  expect(getClientId()).toBe(id);
});

test('getClientId replaces a stored value the API would reject', () => {
  localStorage.setItem('vq.clientId', 'bad id!');
  expect(getClientId()).toMatch(VALID);
});
