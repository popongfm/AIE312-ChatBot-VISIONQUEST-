import type { ChatStreamEvent } from "@vq/shared";

/** Test-only: splits an SSE body into events ({type} merged with the data JSON). */
export function parseSseText(text: string): ChatStreamEvent[] {
  return text
    .split("\n\n")
    .filter((block) => block.trim() !== "")
    .map((block) => {
      const type = /^event: (.+)$/m.exec(block)?.[1];
      const data = /^data: (.+)$/m.exec(block)?.[1];
      return { type, ...JSON.parse(data ?? "{}") } as ChatStreamEvent;
    });
}
