/**
 * Live AI grounding eval (Task 15): asks Oracle 12 questions, scores each answer, writes eval/results.md.
 * Each question is a fresh single-turn chat. Exits 1 if fewer than 10 of 12 pass.
 *
 *   npm run eval -w @vq/api                     local: needs DATABASE_URL (seeded) + GEMINI_API_KEY/GEMINI_MODEL in apps/api/.env
 *   npm run eval -w @vq/api -- --url <site>     remote: asks the deployed site (no key needed); its test chats are deleted afterwards
 */
import { writeFile } from 'node:fs/promises';
import { loadConfig } from '../src/config';
import { createPool } from '../src/db/pool';
import { AiRateLimitError, createGeminiModel, genaiGenerate } from '../src/services/gemini';
import { buildHistory } from '../src/services/history';
import { getPortfolio } from '../src/services/portfolioRepo';
import { buildSystemInstruction } from '../src/services/promptBuilder';
import { type EvalQuestion, loadQuestions, readSse, scoreAnswer } from './score';

const PASS_MARK = 10;
/** Free-tier Gemini allows only a few requests a minute: space the questions out. */
const GAP_MS = 4_000;

type Ask = (question: string) => Promise<string>;
type Result = EvalQuestion & { answer: string; pass: boolean; error?: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function localAsker(): Promise<{ ask: Ask; label: string; close: () => Promise<void> }> {
  try {
    process.loadEnvFile(new URL('../.env', import.meta.url));
  } catch {
    // no apps/api/.env: use the shell environment
  }
  const config = loadConfig();
  if (!config.geminiApiKey || !config.geminiModel) throw new Error('Set GEMINI_API_KEY and GEMINI_MODEL in apps/api/.env (or use --url <site>)');
  const pool = createPool(config.databaseUrl);
  const portfolio = await getPortfolio(pool);
  if (!portfolio) throw new Error('The database has no portfolio: run `npm run seed -w @vq/api` first');
  const systemInstruction = buildSystemInstruction(portfolio);
  const model = createGeminiModel({
    model: config.geminiModel, fallbackModel: config.geminiFallbackModel, generate: genaiGenerate(config.geminiApiKey),
  });
  const ask: Ask = async (question) => {
    let answer = '';
    for await (const t of model.stream({ systemInstruction, history: buildHistory([], question) })) answer += t;
    return answer;
  };
  return { ask, label: `local · ${config.geminiModel}`, close: () => pool.end() };
}

function remoteAsker(site: string): { ask: Ask; label: string; close: () => Promise<void> } {
  const base = site.replace(/\/+$/, '');
  const ask: Ask = async (question) => {
    // A new visitor id per question: fresh chat, and the site's 10-per-minute visitor limit never trips.
    const headers = { 'Content-Type': 'application/json', 'X-Client-Id': `eval-${crypto.randomUUID()}` };
    const created = await fetch(`${base}/api/conversations`, { method: 'POST', headers, body: JSON.stringify({ firstMessage: question }) });
    if (!created.ok) throw new Error(`create conversation: HTTP ${created.status} ${await created.text()}`);
    const { id } = (await created.json()) as { id: string };
    try {
      const res = await fetch(`${base}/api/conversations/${id}/messages`, { method: 'POST', headers, body: JSON.stringify({ content: question }) });
      if (!res.ok || !res.body) throw new Error(`send message: HTTP ${res.status} ${await res.text()}`);
      const { text, end } = await readSse(res.body);
      if (end?.type === 'error') throw Object.assign(new Error(`${end.code}: ${end.message}`), { rateLimited: end.code === 'RATE_LIMITED' });
      return text;
    } finally {
      await fetch(`${base}/api/conversations/${id}`, { method: 'DELETE', headers }).catch(() => undefined);
    }
  };
  return { ask, label: `remote · ${base}`, close: async () => undefined };
}

const isRateLimited = (e: unknown) =>
  e instanceof AiRateLimitError || (typeof e === 'object' && e !== null && (e as { rateLimited?: boolean }).rateLimited === true);

async function askWithRetry(ask: Ask, question: string): Promise<string> {
  try {
    return await ask(question);
  } catch (e) {
    if (!isRateLimited(e)) throw e;
    console.warn('  Gemini quota hit, waiting 60 s and trying once more…');
    await sleep(60_000);
    return ask(question);
  }
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, '<br>');

function report(results: Result[], label: string): string {
  const passed = results.filter((r) => r.pass).length;
  const lines = [
    '# Oracle AI eval results',
    '',
    `${new Date().toISOString()} · ${label} · **${passed}/${results.length} passed** (pass mark ${PASS_MARK})`,
    '',
    'Each question is a fresh single-turn chat. `team`/`member` pass when the answer names a fact from `seed/`;',
    '`refusal` passes when Oracle says it has no data instead of guessing. Questions: `apps/api/eval/questions.json`.',
    '',
    '| id | scope | pass |',
    '|---|---|---|',
    ...results.map((r) => `| ${r.id} | ${r.scope}${r.member ? ` (${r.member})` : ''} | ${r.pass ? '✅' : '❌'} |`),
    '',
    '## Answers',
    '',
    ...results.flatMap((r) => [
      `### ${r.pass ? '✅' : '❌'} ${r.id}`,
      '',
      `**Q:** ${r.question}`,
      '',
      `**Expected:** ${r.expectRefusal ? 'a refusal ("ไม่มีข้อมูล")' : `any of ${r.expectAny?.map((t) => `"${t}"`).join(', ')}`}`,
      '',
      r.error ? `**Error:** ${cell(r.error)}` : `**A:** ${cell(r.answer)}`,
      '',
    ]),
  ];
  return lines.join('\n');
}

async function main() {
  const urlFlag = process.argv.indexOf('--url');
  const site = urlFlag >= 0 ? process.argv[urlFlag + 1] : undefined;
  const { ask, label, close } = site ? remoteAsker(site) : await localAsker();
  const questions = await loadQuestions();
  const results: Result[] = [];
  console.log(`Oracle eval — ${label}\n`);
  try {
    for (const [i, q] of questions.entries()) {
      if (i > 0) await sleep(GAP_MS);
      try {
        const answer = await askWithRetry(ask, q.question);
        results.push({ ...q, answer, pass: scoreAnswer(q, answer) });
      } catch (e) {
        results.push({ ...q, answer: '', pass: false, error: e instanceof Error ? e.message : String(e) });
      }
      const r = results.at(-1)!;
      console.log(`${r.id.padEnd(20)} | ${r.scope.padEnd(7)} | ${r.pass ? 'pass' : 'FAIL'}${r.error ? `  (${r.error})` : ''}`);
    }
  } finally {
    await close();
  }
  const passed = results.filter((r) => r.pass).length;
  const out = new URL('./results.md', import.meta.url);
  await writeFile(out, report(results, label));
  console.log(`\n${passed}/${results.length} passed (need ${PASS_MARK}) · written to apps/api/eval/results.md`);
  process.exitCode = passed >= PASS_MARK ? 0 : 1;
}

await main();
