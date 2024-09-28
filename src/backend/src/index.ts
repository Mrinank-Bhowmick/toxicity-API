import type { VectorizeIndex, Ai } from '@cloudflare/workers-types';
import { CloudflareVectorizeStore, CloudflareWorkersAIEmbeddings } from '@langchain/cloudflare';
import { parse } from 'csv-parse/browser/esm';

export interface Env {
	VECTORIZE_INDEX: VectorizeIndex;
	AI: Ai;
}

export default {
	async fetch(request, env): Promise<Response> {
		const embeddings = new CloudflareWorkersAIEmbeddings({
			binding: env.AI,
			model: '@cf/baai/bge-base-en-v1.5',
		});
		const store = new CloudflareVectorizeStore(embeddings, {
			index: env.VECTORIZE_INDEX,
		});

		// const results = await store.similaritySearch('sal', 5);
		// console.log(JSON.stringify(results, null, 2));
		// return new Response(JSON.stringify(results), {
		// 	headers: { 'Content-Type': 'application/json' },
		// });

		let formData = await request.formData();
		let csvStream = formData.get('training_data.csv').stream();
		const records = [];
		const parser = parse({
			// CSV options if any
		});
	},
} satisfies ExportedHandler<Env>;
