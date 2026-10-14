import type { ChatStreamEvent } from '@vq/shared';

const KNOWN = new Set(['token', 'done', 'error']);

export function createSseParser(onEvent: (e: ChatStreamEvent) => void): {
  push(chunk: string): void;
} {
  let buffer = '';

  function dispatch(block: string): void {
    let event = '';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (!KNOWN.has(event) || data.length === 0) return;
    try {
      const payload: unknown = JSON.parse(data.join('\n'));
      if (typeof payload !== 'object' || payload === null) return;
      onEvent({ type: event, ...payload } as ChatStreamEvent);
    } catch {
      // malformed JSON: ignore
    }
  }

  return {
    push(chunk: string): void {
      buffer += chunk;
      buffer = buffer.replace(/\r\n/g, '\n');
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        dispatch(block);
      }
    },
  };
}
