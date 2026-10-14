import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadConfig } from '../src/config';
import { createPool } from '../src/db/pool';
import { buildHistory } from '../src/services/history';
import { AiRateLimitError, createGeminiModel, genaiGenerate, type ChatModel } from '../src/services/gemini';
import { getPortfolio } from '../src/services/portfolioRepo';
import { buildSystemInstruction } from '../src/services/promptBuilder';
import questions from './questions.json';
import { scoreAnswer, type EvalQuestion } from './score';

const PASS_THRESHOLD = 10;
const RATE_LIMIT_WAIT_MS = 20_000;
const RESULTS_URL = new URL('./results.md', import.meta.url);

interface Result {
  q: EvalQuestion;
  answer: string;
  pass: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ask(model: ChatModel, systemInstruction: string, question: string): Promise<string> {
  let answer = '';
  for await (const chunk of model.stream({ systemInstruction, history: buildHistory([], question) })) {
    answer += chunk;
  }
  return answer;
}

async function askWithRetry(model: ChatModel, systemInstruction: string, question: string): Promise<string> {
  try {
    return await ask(model, systemInstruction, question);
  } catch (err) {
    if (!(err instanceof AiRateLimitError)) throw err;
    console.warn(`Rate limited; retrying in ${RATE_LIMIT_WAIT_MS / 1000}s...`);
    await sleep(RATE_LIMIT_WAIT_MS);
    return ask(model, systemInstruction, question);
  }
}

function renderTable(results: Result[]): string {
  const idW = Math.max(2, ...results.map((r) => r.q.id.length));
  const scopeW = Math.max(5, ...results.map((r) => r.q.scope.length));
  const lines = [`${'id'.padEnd(idW)} | ${'scope'.padEnd(scopeW)} | pass`];
  for (const r of results) {
    lines.push(`${r.q.id.padEnd(idW)} | ${r.q.scope.padEnd(scopeW)} | ${r.pass ? 'PASS' : 'FAIL'}`);
  }
  return lines.join('\n');
}

function renderMarkdown(results: Result[], modelName: string, passed: number): string {
  const date = new Date().toISOString().slice(0, 10);
  const parts = [
    '# VISIONQUEST AI grounding eval',
    '',
    `- Date: ${date}`,
    `- Model: ${modelName}`,
    `- Total: ${passed}/${results.length}`,
    '',
  ];
  for (const r of results) {
    const quoted = (r.answer.trim() || '(empty)').split('\n').map((l) => `> ${l}`).join('\n');
    parts.push(
      `## ${r.q.id}`,
      '',
      `- Scope: ${r.q.scope}`,
      `- Question: ${r.q.question}`,
      `- Pass: ${r.pass ? '✅' : '❌'}`,
      '',
      quoted,
      '',
    );
  }
  return parts.join('\n');
}

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig(process.env);
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }

  const pool = createPool(config.databaseUrl);
  try {
    const portfolio = await getPortfolio(pool);
    if (!portfolio) {
      console.error('No portfolio found in the database. Run `npm run migrate` and `npm run seed` first.');
      process.exitCode = 1;
      return;
    }
    const systemInstruction = buildSystemInstruction(portfolio);
    const model = createGeminiModel({
      model: config.geminiModel,
      fallbackModel: config.geminiFallbackModel,
      generate: genaiGenerate(config.geminiApiKey),
    });

    const results: Result[] = [];
    for (const q of questions as EvalQuestion[]) {
      let answer: string;
      try {
        answer = await askWithRetry(model, systemInstruction, q.question);
      } catch (err) {
        answer = `ERROR: ${(err as Error).message}`;
        const cause = (err as Error).cause;
        if (cause) answer += ` (${cause instanceof Error ? cause.message : String(cause)})`;
        results.push({ q, answer, pass: false });
        continue;
      }
      results.push({ q, answer, pass: scoreAnswer(q, answer) });
    }

    const passed = results.filter((r) => r.pass).length;
    console.log(renderTable(results));
    console.log(`\nTotal: ${passed}/${results.length}`);
    await writeFile(RESULTS_URL, renderMarkdown(results, config.geminiModel, passed), 'utf8');
    if (passed < PASS_THRESHOLD) process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
