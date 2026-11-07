// Stub: contract only, so Task 4 (app deps) can compile before Task 7 lands. Task 7 replaces this file.
import type { Role } from '@vq/shared';

export interface ChatModel {
  stream(args: {
    systemInstruction: string;
    history: { role: Role; text: string }[];
    signal?: AbortSignal;
  }): AsyncIterable<string>;
}
export class AiRateLimitError extends Error {}
export class AiError extends Error {}
