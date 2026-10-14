import { describe, expect, test } from 'vitest';
import type { ChatStreamEvent } from '@vq/shared';
import { createSseParser } from './sse';

function collect() {
  const got: ChatStreamEvent[] = [];
  return { got, p: createSseParser((e) => got.push(e)) };
}

describe('createSseParser', () => {
  test('parser handles an event split across chunks', () => {
    const { got, p } = collect();
    p.push('event: token\ndata: {"te');
    p.push('xt":"สวัส"}\n\nevent: token\ndata: {"text":"ดี"}\n');
    p.push('\nevent: done\ndata: {"messageId":7,"citedMembers":["mickie"]}\n\n');
    expect(got).toEqual([
      { type: 'token', text: 'สวัส' },
      { type: 'token', text: 'ดี' },
      { type: 'done', messageId: 7, citedMembers: ['mickie'] },
    ]);
  });

  test('ignores unknown events and malformed JSON, handles \\r\\n', () => {
    const { got, p } = collect();
    p.push('event: ping\r\ndata: {"x":1}\r\n\r\n');
    p.push('event: token\r\ndata: {bad\r\n\r\n');
    p.push('event: token\r\ndata: {"text":"ok"}\r\n\r\n');
    expect(got).toEqual([{ type: 'token', text: 'ok' }]);
  });

  test('joins multiple data lines with newline', () => {
    const { got, p } = collect();
    p.push('event: token\ndata: {"text":\ndata: "a"}\n\n');
    expect(got).toEqual([{ type: 'token', text: 'a' }]);
  });
});
