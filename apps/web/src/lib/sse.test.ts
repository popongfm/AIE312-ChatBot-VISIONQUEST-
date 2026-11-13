import type { ChatStreamEvent } from '@vq/shared';
import { expect, test } from 'vitest';
import { createSseParser } from './sse';

test('parser handles an event split across chunks', () => {
  const got: ChatStreamEvent[] = [];
  const p = createSseParser((e) => got.push(e));
  p.push('event: token\ndata: {"te');
  p.push('xt":"สวัส"}\n\nevent: token\ndata: {"text":"ดี"}\n');
  p.push('\nevent: done\ndata: {"messageId":7,"citedMembers":["mickie"]}\n\n');
  expect(got).toEqual([
    { type: 'token', text: 'สวัส' },
    { type: 'token', text: 'ดี' },
    { type: 'done', messageId: 7, citedMembers: ['mickie'] },
  ]);
});

test('parser ignores unknown events and malformed data', () => {
  const got: ChatStreamEvent[] = [];
  const p = createSseParser((e) => got.push(e));
  p.push('event: ping\ndata: {}\n\nevent: token\ndata: not-json\n\n: comment\n\nevent: token\r\ndata: {"text":"ok"}\r\n\r\n');
  expect(got).toEqual([{ type: 'token', text: 'ok' }]);
});

test('parser passes through reset events', () => {
  const got: ChatStreamEvent[] = [];
  const p = createSseParser((e) => got.push(e));
  p.push('event: token\ndata: {"text":"ครึ่ง"}\n\nevent: reset\ndata: {}\n\nevent: token\ndata: {"text":"ใหม่"}\n\n');
  expect(got).toEqual([{ type: 'token', text: 'ครึ่ง' }, { type: 'reset' }, { type: 'token', text: 'ใหม่' }]);
});
