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

const WHITELIST = ['swear']; // List of whitelisted words in lowercase
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
				return cleanedWord.length > 0 && !WHITELIST.includes(cleanedWord);
			})
			.join(' ')
			.replace(/\s+/g, ' '); // Replace multiple spaces with a single space.

		const [wordChunks, semanticChunks] = await Promise.all([splitTextIntoWords(message), splitTextIntoSemantics(message)]);

		const flaggedFor = new Set<{ score: number; text: string }>();
		const lowerScoreWords = new Set<{ score: number; text: string }>();

		for (let i = 0; i < wordChunks.length; i = i + 100) {
			const queryVector: EmbeddingResponse = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text: wordChunks.slice(i, i + 100),
			});
			//console.log(queryVector);
			for (let j = 0; j < queryVector.data.length; j++) {
				const matches = await c.env.VECTORIZE.query(queryVector.data[j], {
					topK: 1,
					returnMetadata: true,
				});
				const matchedChunkObject = matches.matches[0];

				if (matchedChunkObject.score > 0.93) {
					flaggedFor.add({
						text: matchedChunkObject.metadata!.word as string,
						score: matchedChunkObject.score,
					});
				} else {
					lowerScoreWords.add({
						text: matchedChunkObject.metadata!.word as string,
						score: matchedChunkObject.score,
					});
				}
			}
		}

		for (let i = 0; i < semanticChunks.length; i = i + 100) {
			const queryVector: EmbeddingResponse = await c.env.AI.run('@cf/baai/bge-base-en-v1.5', {
				text: semanticChunks.slice(i, i + 100),
			});
			for (let j = 0; j < queryVector.data.length; j++) {
				const matches = await c.env.VECTORIZE.query(queryVector.data[j], {
					topK: 1,
					returnMetadata: true,
				});
				const matchedChunkObject = matches.matches[0];

				if (matchedChunkObject.score > 0.85) {
					flaggedFor.add({
						text: matchedChunkObject.metadata!.word as string,
						score: matchedChunkObject.score,
					});
				} else {
					lowerScoreWords.add({
						text: matchedChunkObject.metadata!.word as string,
						score: matchedChunkObject.score,
					});
				}
			}
		}

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

const splitTextIntoWords = (message: string) => {
	return message.split(' ');
};
const splitTextIntoSemantics = async (message: string) => {
	if (message.split(' ').length === 1) {
		return []; // no need to again check as we are already doing it in splitTextIntoWords
	}

	const documents = await semanticSplitter.createDocuments([message]);
	const chunks = documents.map((chunk) => {
		return chunk.pageContent;
	});
	return chunks;
};

export default app;
