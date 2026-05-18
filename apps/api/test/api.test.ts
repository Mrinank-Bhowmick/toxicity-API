import { createServer } from '../src/main';
import type { Deps } from '../src/toxicity';

function makeDeps(score: number, word: string): Deps {
  return {
    embed: async (texts) => texts.map(() => Array.from({ length: 768 }, () => 0)),
    nearestMatch: async () => ({ score, word }),
  };
}

describe('POST /', () => {
  it('returns isToxic=false for a clean message under the threshold', async () => {
    const app = createServer({ deps: makeDeps(0.42, 'mild'), corsOrigin: '*' });
    const res = await app.inject({ method: 'POST', url: '/', payload: { message: 'hello there friend' } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ isToxic: false, score: 0.42 });
    await app.close();
  });

  it('returns isToxic=true with flaggedFor when score exceeds word threshold', async () => {
    const app = createServer({ deps: makeDeps(0.97, 'badword'), corsOrigin: '*' });
    const res = await app.inject({ method: 'POST', url: '/', payload: { message: 'something offensive here' } });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ isToxic: true, score: 0.97, flaggedFor: 'badword' });
    await app.close();
  });

  it('rejects missing message with 400', async () => {
    const app = createServer({ deps: makeDeps(0.1, 'x'), corsOrigin: '*' });
    const res = await app.inject({ method: 'POST', url: '/', payload: {} });
    expect(res.statusCode).toBe(400);
    await app.close();
  });

  it('rejects messages longer than 1000 chars with 400', async () => {
    const app = createServer({ deps: makeDeps(0.1, 'x'), corsOrigin: '*' });
    const res = await app.inject({
      method: 'POST',
      url: '/',
      payload: { message: 'a'.repeat(1001) },
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('1000');
    await app.close();
  });

  it('rejects unknown properties (strict schema)', async () => {
    const app = createServer({ deps: makeDeps(0.1, 'x'), corsOrigin: '*' });
    const res = await app.inject({
      method: 'POST',
      url: '/',
      payload: { message: 'hi', extra: 'nope' },
    });
    expect(res.statusCode).toBe(400);
    await app.close();
  });
});
