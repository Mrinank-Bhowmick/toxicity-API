import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CloudflareEmbeddingsService } from '../src/embeddings/cloudflare-embeddings.service';
import { SplitterService } from '../src/text-splitting/splitter.service';
import { ToxicityController } from '../src/toxicity/toxicity.controller';
import { ToxicityService } from '../src/toxicity/toxicity.service';
import { ToxicTermsRepository } from '../src/vector-store/toxic-terms.repository';

class FakeEmbeddings {
  constructor(private readonly dim = 768) {}
  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(() => Array.from({ length: this.dim }, () => 0));
  }
}

class FakeRepo {
  constructor(private readonly score: number, private readonly word: string) {}
  async nearestNeighbor(): Promise<{ word: string; score: number }> {
    return { word: this.word, score: this.score };
  }
}

async function makeApp(
  repoScore: number,
  repoWord: string,
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [ToxicityController],
    providers: [
      ToxicityService,
      SplitterService,
      {
        provide: CloudflareEmbeddingsService,
        useValue: new FakeEmbeddings(),
      },
      {
        provide: ToxicTermsRepository,
        useValue: new FakeRepo(repoScore, repoWord),
      },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

describe('POST / (toxicity)', () => {
  let app: INestApplication;

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns isToxic=false for a clean message under the threshold', async () => {
    app = await makeApp(0.42, 'mild');
    const res = await request(app.getHttpServer())
      .post('/')
      .set('Content-Type', 'application/json')
      .send({ message: 'hello there friend' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isToxic: false, score: 0.42 });
  });

  it('returns isToxic=true with flaggedFor when score exceeds word threshold', async () => {
    app = await makeApp(0.97, 'badword');
    const res = await request(app.getHttpServer())
      .post('/')
      .set('Content-Type', 'application/json')
      .send({ message: 'something offensive here' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      isToxic: true,
      score: 0.97,
      flaggedFor: 'badword',
    });
  });

  it('rejects missing message with 400', async () => {
    app = await makeApp(0.1, 'x');
    const res = await request(app.getHttpServer())
      .post('/')
      .set('Content-Type', 'application/json')
      .send({});

    expect(res.status).toBe(400);
  });

  it('rejects messages longer than 1000 chars with 400', async () => {
    app = await makeApp(0.1, 'x');
    const long = 'a'.repeat(1001);
    const res = await request(app.getHttpServer())
      .post('/')
      .set('Content-Type', 'application/json')
      .send({ message: long });

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toContain('1000 characters');
  });

  it('rejects unknown properties (whitelist)', async () => {
    app = await makeApp(0.1, 'x');
    const res = await request(app.getHttpServer())
      .post('/')
      .set('Content-Type', 'application/json')
      .send({ message: 'hi', extra: 'nope' });

    expect(res.status).toBe(400);
  });
});
