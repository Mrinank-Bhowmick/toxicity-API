/*
npx wrangler vectorize create toxicity-api --dimensions=768 --metric=cosine
npx wrangler vectorize create-metadata-index toxicity-api --property-name=word --type=string
npx wrangler vectorize list-metadata-index toxicity-api
*/

interface Env {
	VECTORIZE: Vectorize;
	AI: Ai;
}
interface EmbeddingResponse {
	shape: number[];
	data: number[][];
}

export default {
	async fetch(request, env: Env): Promise<Response> {
		const path = new URL(request.url).pathname;
		if (path.startsWith('/favicon')) {
			return new Response('', { status: 404 });
		}

		if (path === '/insert') {
			const words = ['word 1', 'word 2']; // fill this list
			const batchSize = 100; // Define the batch size for embedding model

			let id = 0;
			const vectors: VectorizeVector[] = [];

			for (let i = 0; i < words.length; i += batchSize) {
				const wordBatch = words.slice(i, i + batchSize); // Split words into batches

				// Call embedding model for each batch
				const modelResp: EmbeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
					text: wordBatch,
				});

				// Process the returned embeddings
				for (const vector of modelResp.data) {
					vectors.push({ id: `${id}`, values: vector, metadata: { word: words[id] } });
					id++;

					// If vectors reach a batch of 99 or it's the last item in the entire list
					if (vectors.length === batchSize || id === words.length) {
						const result = await env.VECTORIZE.upsert(vectors);
						console.log(result);
						vectors.length = 0; // Reset the vectors array
					}
				}
			}

			return Response.json('done');
		}

		// Your query: expect this to match vector ID. 1 in this example
		const userQuery = 'fuc';
		const queryVector: EmbeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
			text: [userQuery],
		});

		const matches = await env.VECTORIZE.query(queryVector.data[0], {
			topK: 5,
			returnMetadata: 'all',
			//returnValues:true
		});
		return Response.json({
			matches: matches,
		});
	},
} satisfies ExportedHandler<Env>;
