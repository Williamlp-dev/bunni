import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Buni Media Worker - Proxy & Cache', () => {
	it('deve retornar 404 se nenhuma url/key for informada na raiz', async () => {
		const request = new IncomingRequest('http://buni-media.com/');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(404);
		expect(await response.text()).toBe('Not found');
	});

	it('deve retornar 405 se o método não for GET ou HEAD (ex: POST)', async () => {
		const request = new IncomingRequest('http://buni-media.com/avatar.png', { method: 'POST' });
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);
		expect(response.status).toBe(405);
		expect(await response.text()).toBe('Method not allowed');
	});

	it('deve retornar Headers de CORS apropriados em requisições preflight (OPTIONS)', async () => {
		const request = new IncomingRequest('http://buni-media.com/avatar.png', { method: 'OPTIONS' });
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);

		await waitOnExecutionContext(ctx);

		// Conforme lógica da API as requisições OPTIONS retornam null body 
		// com um status OK padrão ou 200, além dos headers liberados.
		expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
		expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, HEAD, OPTIONS');
	});
});
