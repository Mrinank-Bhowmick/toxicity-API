import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use(cors());

app.post('/', async (c) => {
	if (c.req.header('Content-Type') !== 'application/json') {
		return c.json({ error: 'JSON Body Expected' }, { status: 406 });
	}
});

export default app;
