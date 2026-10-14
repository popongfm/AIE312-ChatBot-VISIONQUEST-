import { Router, type Response } from "express";
import { z } from "zod";
import { CHAT_ERROR_COPY, type ChatStreamEvent } from "@vq/shared";
import type { AppDeps } from "../app";
import { requireClientId } from "../middleware/clientId";
import { HttpError } from "../middleware/errors";
import { createMessageLimiters } from "../middleware/rateLimit";
import {
  createConversation,
  getOwnedConversation,
  insertMessage,
  listConversations,
  listMessages,
  recentMessages,
  setTitleIfDefault,
} from "../services/chatRepo";
import { detectCitations } from "../services/citations";
import { AiRateLimitError } from "../services/gemini";
import { buildHistory } from "../services/history";
import { buildSystemInstruction } from "../services/promptBuilder";
import { makeTitle } from "../services/title";

const bodySchema = z.object({ content: z.string().trim().min(1).max(1000) });

function sendEvent(res: Response, event: ChatStreamEvent): void {
  const { type, ...data } = event;
  res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function conversationsRouter(
  deps: Pick<AppDeps, "pool" | "model" | "portfolio">,
): Router {
  const r = Router();
  r.use("/conversations", requireClientId);

  r.post("/conversations", async (_req, res) => {
    res
      .status(201)
      .json(await createConversation(deps.pool, res.locals.clientId as string));
  });

  r.get("/conversations", async (_req, res) => {
    res.json(await listConversations(deps.pool, res.locals.clientId as string));
  });

  r.get("/conversations/:id/messages", async (req, res) => {
    const conv = await getOwnedConversation(
      deps.pool,
      req.params.id,
      res.locals.clientId as string,
    );
    if (!conv) throw new HttpError(404, "NOT_FOUND", "Conversation not found");
    res.json(await listMessages(deps.pool, conv.id));
  });

  r.post(
    "/conversations/:id/messages",
    ...createMessageLimiters(),
    async (req, res) => {
      // Attach early so a client that disconnects during the DB awaits skips the model call.
      const ac = new AbortController();
      res.on("close", () => {
        if (!res.writableEnded) ac.abort();
      });
      const parsed = bodySchema.safeParse(req.body);
      if (!parsed.success)
        throw new HttpError(
          400,
          "BAD_CONTENT",
          "content must be 1-1000 characters",
        );
      const { content } = parsed.data;
      const conv = await getOwnedConversation(
        deps.pool,
        String(req.params.id),
        res.locals.clientId as string,
      );
      if (!conv)
        throw new HttpError(404, "NOT_FOUND", "Conversation not found");

      // Prior turns first (excludes the new message), then persist the user row.
      const prior = await recentMessages(deps.pool, conv.id, 10);
      await insertMessage(deps.pool, {
        conversationId: conv.id,
        role: "user",
        content,
      });
      await setTitleIfDefault(deps.pool, conv.id, makeTitle(content));
      const portfolio = await deps.portfolio.get();

      res.status(200).set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.flushHeaders();

      // From here on, nothing may reach the JSON errorHandler.
      if (!portfolio) {
        sendEvent(res, {
          type: "error",
          code: "AI_ERROR",
          message: CHAT_ERROR_COPY.AI_ERROR,
        });
        res.end();
        return;
      }

      if (ac.signal.aborted) return; // client already gone; the user row stays

      let fullText = "";
      try {
        const stream = deps.model.stream({
          systemInstruction: buildSystemInstruction(portfolio),
          history: buildHistory(prior, content),
          signal: ac.signal,
        });
        for await (const chunk of stream) {
          if (ac.signal.aborted) break;
          fullText += chunk;
          sendEvent(res, { type: "token", text: chunk });
        }
        const citedMembers = detectCitations(fullText, portfolio.members);
        if (ac.signal.aborted) {
          if (fullText)
            await insertMessage(deps.pool, {
              conversationId: conv.id,
              role: "model",
              content: fullText,
              citedMembers,
            });
          return;
        }
        const saved = await insertMessage(deps.pool, {
          conversationId: conv.id,
          role: "model",
          content: fullText,
          citedMembers,
        });
        sendEvent(res, { type: "done", messageId: saved.id, citedMembers });
        res.end();
      } catch (err) {
        if (ac.signal.aborted) {
          // Client went away; keep whatever was streamed. Not an AI error.
          if (fullText) {
            const citedMembers = detectCitations(fullText, portfolio.members);
            await insertMessage(deps.pool, {
              conversationId: conv.id,
              role: "model",
              content: fullText,
              citedMembers,
            }).catch((e: unknown) =>
              console.error("failed to save partial message", e),
            );
          }
          return;
        }
        if (err instanceof AiRateLimitError) {
          sendEvent(res, {
            type: "error",
            code: "RATE_LIMITED",
            message: CHAT_ERROR_COPY.RATE_LIMITED,
          });
        } else {
          console.error("chat stream failed", err);
          sendEvent(res, {
            type: "error",
            code: "AI_ERROR",
            message: CHAT_ERROR_COPY.AI_ERROR,
          });
        }
        res.end();
      }
    },
  );

  return r;
}
