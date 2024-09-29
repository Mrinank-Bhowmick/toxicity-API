import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Bindings {
	secret: string;
}
const WHITELIST = ['swear']; // List of whitelisted words in lowercase

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

app.post('/', async (c) => {
	if (c.req.header('Content-Type') !== 'application/json') {
		return c.json({ error: 'JSON Body Expected' }, { status: 406 });
	}

	try {
		const body = await c.req.json();
		console.log(body);
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
				return !WHITELIST.includes(cleanedWord);
			})
			.join('');

		return c.json({ msg: message });
	} catch (error) {
		console.log(error);
	}
});

export default app;
