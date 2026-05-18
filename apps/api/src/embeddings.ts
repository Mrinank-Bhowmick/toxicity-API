const TIMEOUT_MS = 30_000;
const MAX_BATCH = 100;

type CfResponse = {
  result?: { shape: number[]; data: number[][] };
  success: boolean;
  errors?: { code: number; message: string }[];
};

export type EmbedBatch = (texts: string[]) => Promise<number[][]>;

export function createEmbedder(opts: {
  accountId: string;
  apiToken: string;
  model: string;
}): EmbedBatch {
  const url = `https://api.cloudflare.com/client/v4/accounts/${opts.accountId}/ai/run/${opts.model}`;
  return async function embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    if (texts.length > MAX_BATCH) {
      throw new Error(`embedBatch: max ${MAX_BATCH} texts, got ${texts.length}`);
    }
    const res = await callWithRetry(url, opts.apiToken, JSON.stringify({ text: texts }));
    const json = (await res.json()) as CfResponse;
    if (!json.success || !json.result) {
      throw new Error(`cloudflare embed failed: ${JSON.stringify(json.errors)}`);
    }
    return json.result.data;
  };
}

async function callWithRetry(url: string, token: string, body: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body,
        signal: ctrl.signal,
      });
      if ((res.status === 429 || res.status >= 500) && attempt === 1) {
        lastErr = new Error(`upstream ${res.status}`);
        continue;
      }
      if (!res.ok) throw new Error(`cloudflare ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return res;
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(t);
    }
  }
  throw new Error(`cloudflare unreachable: ${String(lastErr)}`);
}
