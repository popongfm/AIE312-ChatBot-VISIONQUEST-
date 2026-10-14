import { expect, test } from 'vitest';
import { CHAT_ERROR_COPY, displayName } from './index';

test('displayName prefers nickname', () => {
  expect(displayName({ name: 'สมชาย ใจดี', nickname: 'Mickie' })).toBe('Mickie');
  expect(displayName({ name: 'สมชาย ใจดี', nickname: null })).toBe('สมชาย ใจดี');
});
test('chat error copy is fixed Thai text', () => {
  expect(CHAT_ERROR_COPY.RATE_LIMITED).toBe('AI คิวเต็ม ลองใหม่ในอีกสักครู่');
  expect(CHAT_ERROR_COPY.AI_ERROR).toBe('Oracle ขัดข้อง ลองใหม่อีกครั้ง');
});
