import { Ai } from '@cloudflare/workers-types';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

interface Bindings {
	AI: Ai;
	VECTORIZE: Vectorize;
}

interface EmbeddingResponse {
	shape: number[];
	data: number[][];
}

const WHITELIST = new Set(['swear']);
const BATCH_SIZE = 50;

const semanticSplitter = new RecursiveCharacterTextSplitter({
	chunkSize: 10,
	chunkOverlap: 1,
	separators: [' '],
});

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

app.post('/', async (c) => {
	if (c.req.header('Content-Type') !== 'application/json') {
		return c.json({ error: 'JSON Body Expected' }, { status: 406 });
	}

	try {
		const body = await c.req.json();
		let { message } = body as { message: string };
		if (!message) {
			return c.json({ error: 'Message arguement is required. ' }, { status: 400 });
		}
		if (message.length > 1000) {
			return c.json({ error: 'Message contains greater than 1000 characters. ' }, { status: 413 });
		}
		message = message
			.split(/\b/)
			.filter((word) => {
				const cleanedWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
				return cleanedWord.length > 0 && !WHITELIST.has(cleanedWord);
			})
			.join(' ')
			.replace(/\s+/g, ' ');

		const [wordChunks, semanticChunks] = await Promise.all([splitTextIntoWords(message), splitTextIntoSemantics(message)]);

		const allChunks = [
			...wordChunks.map((chunk) => ({ chunk, threshold: 0.93 })),
			...semanticChunks.map((chunk) => ({ chunk, threshold: 0.85 })),
		];

		const allResults = await processAllChunksConcurrently(allChunks, c.env.AI, c.env.VECTORIZE);

		const flaggedFor = new Set<{ score: number; text: string }>();
		const lowerScoreWords = new Set<{ score: number; text: string }>();

		allResults.forEach((result) => {
			if (result.score > result.threshold) {
				flaggedFor.add({ score: result.score, text: result.text });
			} else {
				lowerScoreWords.add({ score: result.score, text: result.text });
			}
		});

		if (flaggedFor.size > 0) {
			const sorted = Array.from(flaggedFor).sort((a, b) => (a.score > b.score ? -1 : 1));

			return c.json({
				isToxic: true,
				score: sorted[0].score,
				flaggedFor: sorted[0].text,
			});
		} else {
			const sorted = Array.from(lowerScoreWords).sort((a, b) => (a.score > b.score ? -1 : 1));

			return c.json({
				isToxic: false,
				score: sorted[0].score,
			});
		}
	} catch (error) {
		console.error(error);
		return c.json(
			{
				error: 'Something went wrong',
			},
			{ status: 500 }
		);
	}
});

const processAllChunksConcurrently = async (
	chunks: { chunk: string; threshold: number }[],
	ai: Ai,
	vectorize: Vectorize
): Promise<{ score: number; text: string; threshold: number }[]> => {
	if (chunks.length === 0) return [];

	const batches: { chunk: string; threshold: number }[][] = [];
	for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
		batches.push(chunks.slice(i, i + BATCH_SIZE));
	}

	const embeddingPromises = batches.map(async (batch) => {
		const texts = batch.map((item) => item.chunk);
		const embedding: EmbeddingResponse = await ai.run('@cf/baai/bge-base-en-v1.5', { text: texts });
		return { embedding, batch };
	});

	const embeddingResults = await Promise.all(embeddingPromises);

	const allVectorQueries = embeddingResults.flatMap(({ embedding, batch }) =>
		embedding.data.map(async (vector, index) => {
			const matches = await vectorize.query(vector, {
				topK: 1,
				returnMetadata: true,
			});
			const matchedChunkObject = matches.matches[0];
			return {
				score: matchedChunkObject.score,
				text: matchedChunkObject.metadata!.word as string,
				threshold: batch[index].threshold,
			};
		})
	);

	return Promise.all(allVectorQueries);
};

const splitTextIntoWords = (message: string) => {
	return message.split(' ');
};

const splitTextIntoSemantics = async (message: string) => {
	if (message.split(' ').length === 1) {
		return [];
	}

	const documents = await semanticSplitter.createDocuments([message]);
	const chunks = documents.map((chunk) => {
		return chunk.pageContent;
	});
	return chunks;
};

export default app;
