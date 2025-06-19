/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { Hono } from 'hono';
import { Ai } from '@cloudflare/ai';

const app = new Hono<{ Bindings: Env }>();

const responseHeaders = {
	'content-type': 'application/json',
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

app.get('/', async (c) => {
	const ai = new Ai(c.env.AI);

	const content = c.req.query('query') || "You didn't provide any query parameters.";

	const messages = [
		{ role: 'system', content: 'You are a fun snarky assistant.' },
		{ role: 'user', content },
	];

	const inputs = { messages };

	const response = await ai.run('@cf/mistral/mistral-7b-instruct-v0.1', inputs);

	return c.json({ response }, 200, responseHeaders);
});

app.get('/:username', async (c) => {
	const username = c.req.param('username');

	const cachedResponse = await c.env.CACHE.get(username, 'json');
	if (cachedResponse) {
		return c.json(cachedResponse, 200, responseHeaders);
	}

	if (!username) {
		return c.json({ error: 'Username is required' }, 400, responseHeaders);
	}

	const response = await fetch(`https://api.github.com/users/${username}/repos`, {
		headers: {
			'User-Agent': 'CF-Worker',
		},
	});

	const data = await response.json();

	if (!response.ok) {
		return c.json({ error: 'Failed to fetch data from GitHub' }, 404, responseHeaders);
	}
	await c.env.CACHE.put(username, JSON.stringify(data));
	return c.json({ status: 'ok', data: data }, 200, responseHeaders);
});

app.get('/movies', async (c) => {
	const db = c.env.DB;
	const query = 'SELECT * FROM movies ORDER BY release_year DESC';
	try {
		const result = await db.prepare(query).all();
		return c.json({ status: 'ok', data: result }, 200, responseHeaders);
	} catch (error) {
		console.error('Database query error:', error);
		return c.json({ error: 'Database query failed' }, 500, responseHeaders);
	}
});

export default app;
