import { randomUUID } from "node:crypto";
import path from "node:path";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../app";
import { applySeed, loadSeed } from "../db/seed";
import { AiError, AiRateLimitError } from "../services/gemini";
import { resetDb, testPool } from "../../test/helpers/db";
import { deps } from "../../test/helpers/deps";
import { fakeModel } from "../../test/helpers/fakeModel";
import { parseSseText } from "../../test/helpers/sse";

const pool = testPool();
const fixtureDir = path.resolve(__dirname, "../../test/fixtures/seed");
const A = randomUUID();
const B = randomUUID();
let convId: string;

const appWith = (
  model: ReturnType<typeof fakeModel>,
  over: Partial<ReturnType<typeof deps>> = {},
): Express => createApp({ ...deps(pool), model, ...over });

const send = (app: Express, clientId: string, id: string, content: unknown) =>
  request(app)
    .post(`/api/conversations/${id}/messages`)
    .set("X-Client-Id", clientId)
    .send({ content });

beforeEach(async () => {
  await resetDb(pool);
  await applySeed(pool, await loadSeed(fixtureDir));
  const res = await request(createApp(deps(pool)))
    .post("/api/conversations")
    .set("X-Client-Id", A);
  convId = res.body.id;
});
afterAll(() => pool.end());

describe("POST /api/conversations/:id/messages", () => {
  test("streams tokens then done, persists both rows with citations", async () => {
    const model = fakeModel(["ถาม ", "Mickie ", "ได้เลย"]);
    const res = await send(appWith(model), A, convId, "ใครทำ AI");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
    expect(res.headers["cache-control"]).toBe("no-cache, no-transform");
    expect(res.headers["x-accel-buffering"]).toBe("no");
    const events = parseSseText(res.text);
    expect(
      events
        .filter((e) => e.type === "token")
        .map((e) => (e as { text: string }).text)
        .join(""),
    ).toBe("ถาม Mickie ได้เลย");
    expect(events.at(-1)).toMatchObject({
      type: "done",
      citedMembers: ["mickie"],
    });
    const rows = (
      await pool.query("SELECT role, cited_members FROM messages ORDER BY id")
    ).rows;
    expect(rows).toEqual([
      { role: "user", cited_members: [] },
      { role: "model", cited_members: ["mickie"] },
    ]);
    const done = events.at(-1) as { messageId: number };
    const modelRow = (
      await pool.query("SELECT id FROM messages WHERE role='model'")
    ).rows[0];
    expect(done.messageId).toBe(Number(modelRow.id));
  });

  test("system instruction includes portfolio and history is normalised", async () => {
    const model = fakeModel(["ok"]);
    await send(appWith(model), A, convId, "ใครทำ AI");
    expect(model.calls[0]!.systemInstruction).toContain("<portfolio>");
    expect(model.calls[0]!.history).toEqual([
      { role: "user", text: "ใครทำ AI" },
    ]);
  });

  test("first message sets title", async () => {
    await send(appWith(fakeModel(["ok"])), A, convId, "ใครทำ AI");
    const list = await request(createApp(deps(pool)))
      .get("/api/conversations")
      .set("X-Client-Id", A);
    expect(list.body[0].title).toBe("ใครทำ AI");
  });

  test("content is trimmed before saving", async () => {
    await send(appWith(fakeModel(["ok"])), A, convId, "   hello  ");
    const row = (
      await pool.query("SELECT content FROM messages WHERE role='user'")
    ).rows[0];
    expect(row.content).toBe("hello");
  });

  test("rate-limited AI → error event, user row kept, no model row", async () => {
    const res = await send(
      appWith(fakeModel([new AiRateLimitError()])),
      A,
      convId,
      "hi",
    );
    expect(res.status).toBe(200);
    expect(parseSseText(res.text).at(-1)).toEqual({
      type: "error",
      code: "RATE_LIMITED",
      message: "AI คิวเต็ม ลองใหม่ในอีกสักครู่",
    });
    expect(
      (
        await pool.query(
          "SELECT count(*)::int c FROM messages WHERE role='user'",
        )
      ).rows[0].c,
    ).toBe(1);
    expect(
      (
        await pool.query(
          "SELECT count(*)::int c FROM messages WHERE role='model'",
        )
      ).rows[0].c,
    ).toBe(0);
  });

  test("other AI failure after partial tokens → AI_ERROR event, logged, no model row", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const res = await send(
        appWith(fakeModel(["par", new AiError("boom")])),
        A,
        convId,
        "hi",
      );
      const events = parseSseText(res.text);
      expect(events[0]).toEqual({ type: "token", text: "par" });
      expect(events.at(-1)).toEqual({
        type: "error",
        code: "AI_ERROR",
        message: "Oracle ขัดข้อง ลองใหม่อีกครั้ง",
      });
      expect(spy).toHaveBeenCalled();
      expect(
        (
          await pool.query(
            "SELECT count(*)::int c FROM messages WHERE role='model'",
          )
        ).rows[0].c,
      ).toBe(0);
      expect(
        (
          await pool.query(
            "SELECT count(*)::int c FROM messages WHERE role='user'",
          )
        ).rows[0].c,
      ).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });

  test("portfolio not seeded → AI_ERROR event, model not called, user row kept", async () => {
    const model = fakeModel(["x"]);
    const res = await send(
      appWith(model, { portfolio: { get: async () => null } }),
      A,
      convId,
      "hi",
    );
    expect(res.status).toBe(200);
    expect(parseSseText(res.text)).toEqual([
      {
        type: "error",
        code: "AI_ERROR",
        message: "Oracle ขัดข้อง ลองใหม่อีกครั้ง",
      },
    ]);
    expect(model.calls).toHaveLength(0);
    expect(
      (await pool.query("SELECT count(*)::int c FROM messages")).rows[0].c,
    ).toBe(1);
  });

  test.each([["   "], ["ก".repeat(1001)], [undefined], [42]])(
    "invalid content %j → 400 BAD_CONTENT",
    async (c) => {
      const res = await send(appWith(fakeModel(["x"])), A, convId, c);
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("BAD_CONTENT");
      expect(
        (await pool.query("SELECT count(*)::int c FROM messages")).rows[0].c,
      ).toBe(0);
    },
  );

  test("foreign / unknown / non-UUID conversation → 404", async () => {
    const app = appWith(fakeModel(["x"]));
    expect((await send(app, B, convId, "hi")).status).toBe(404);
    expect((await send(app, A, randomUUID(), "hi")).status).toBe(404);
    const bad = await send(app, A, "nope", "hi");
    expect(bad.status).toBe(404);
    expect(bad.body.error.code).toBe("NOT_FOUND");
  });

  test("missing X-Client-Id → 400 BAD_CLIENT_ID", async () => {
    const res = await request(appWith(fakeModel(["x"])))
      .post(`/api/conversations/${convId}/messages`)
      .send({ content: "hi" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_CLIENT_ID");
  });

  test("11th message in a minute from one client → 429 JSON", async () => {
    const app = appWith(fakeModel(["ok"]));
    for (let i = 0; i < 10; i++)
      await send(app, A, convId, `q${i}`).expect(200);
    const r = await send(app, A, convId, "q10");
    expect(r.status).toBe(429);
    expect(r.body.error).toEqual({
      code: "TOO_MANY_REQUESTS",
      message: "ส่งข้อความถี่เกินไป รอสักครู่แล้วลองใหม่",
    });
    // another client is unaffected (per-client key)
    const otherConv = (
      await request(app).post("/api/conversations").set("X-Client-Id", B)
    ).body.id;
    await send(app, B, otherConv, "hi").expect(200);
  });

  test("each createApp gets fresh limiter state", async () => {
    const first = appWith(fakeModel(["ok"]));
    for (let i = 0; i < 10; i++)
      await send(first, A, convId, `q${i}`).expect(200);
    await send(appWith(fakeModel(["ok"])), A, convId, "again").expect(200);
  });

  test("second message sends prior turns as history", async () => {
    const model = fakeModel(["ตอบ"]);
    const app = appWith(model);
    await send(app, A, convId, "one").expect(200);
    await send(app, A, convId, "two").expect(200);
    expect(model.calls[1]!.history).toEqual([
      { role: "user", text: "one" },
      { role: "model", text: "ตอบ" },
      { role: "user", text: "two" },
    ]);
  });
});
