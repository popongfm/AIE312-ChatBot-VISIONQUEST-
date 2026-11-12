import type { ChatStreamEvent } from '@vq/shared';

/** Splits an SSE response body into events, for test assertions only (the web app has its own parser). */
export function parseSseText(text: string): ChatStreamEvent[] {
  return text
    .split('\n\n')
    .filter((block) => block.trim())
    .map((block) => {
      const type = /^event: (.*)$/m.exec(block)?.[1];
      const data = /^data: (.*)$/m.exec(block)?.[1];
      return { type, ...JSON.parse(data ?? '{}') } as ChatStreamEvent;
    });
}
