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

app.get('/', async (c) => {
	const ai = new Ai(c.env.AI);

	const content = c.req.query('query') || "You didn't provide any query parameters.";

	const messages = [
		{ role: 'system', content: 'You are a fun snarky assistant.' },
		{ role: 'user', content },
	];

	const inputs = { messages };

	const response = await ai.run('@cf/mistral/mistral-7b-instruct-v0.1', inputs);

	return c.json({ response }, 200, {
		'content-type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	});
});

export default app;
