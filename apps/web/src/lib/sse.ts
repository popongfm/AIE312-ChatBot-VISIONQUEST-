import type { ChatStreamEvent } from '@vq/shared';

const KNOWN = new Set(['token', 'done', 'error']);

/**
 * Turns the raw text of a Server-Sent Events stream into chat events.
 * Network chunks can cut an event anywhere, so text is buffered until a blank line ends the event.
 */
export function createSseParser(onEvent: (e: ChatStreamEvent) => void): { push(chunk: string): void } {
  let buffer = '';

  function emit(block: string): void {
    let type = '';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) type = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
    if (!KNOWN.has(type)) return;
    try {
      const payload = JSON.parse(data.join('\n')) as object;
      onEvent({ type, ...payload } as ChatStreamEvent);
    } catch {
      // A broken event is dropped; the stream then ends without `done` and the UI reports a lost connection.
    }
  }

  return {
    push(chunk: string): void {
      buffer = (buffer + chunk).replace(/\r\n/g, '\n');
      let end = buffer.indexOf('\n\n');
      while (end !== -1) {
        emit(buffer.slice(0, end));
        buffer = buffer.slice(end + 2);
        end = buffer.indexOf('\n\n');
      }
    },
  };
}
