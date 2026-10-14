import type { Role } from '@vq/shared';

export interface ChatModel {
  stream(args: {
    systemInstruction: string;
    history: { role: Role; text: string }[];
    signal?: AbortSignal;
  }): AsyncIterable<string>;
}
