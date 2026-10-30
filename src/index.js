import { isAuthorized } from './helper/authorized.js';
import { encodeBase62, decodeBase62 } from './helper/base62.js';

export default {
	async fetch(request, env) {
		const url = new URL(request.url);

		// 1. GET: Redirect short links
		if (request.method === 'GET') {
			const path = url.pathname.substring(1);

			// Ignore unnecessary requests
			if (path === '' || path === 'favicon.ico' || path === 'robots.txt') {
				return new Response(null, {
					status: 204,
					headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
				});
			}

			// Only accept a single short code in the path
			if (path.includes('/')) {
				return new Response('Link not found', {
					status: 404,
					headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
				});
			}

			// Decode Base62 to database ID
			const id = decodeBase62(path);

			if (id === null || id < 1) {
				return new Response('Link not found', {
					status: 404,
					headers: { 'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable' },
				});
			}

			// Query D1 by ID
			const row = await env.DB.prepare('SELECT long_url FROM links WHERE id = ?').bind(id).first();

			if (!row) {
				return new Response('Link not found', {
					status: 404,
					headers: { 'Cache-Control': 'public, max-age=0, s-maxage=600' },
				});
			}

			// Redirect; Workers Caching có thể cache response này
			return new Response(null, {
				status: 301,
				headers: {
					Location: row.long_url,
					'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
				},
			});
		}

		// 2. POST: Create short links
		if (request.method === 'POST') {
			try {
				if (!isAuthorized(request.headers.get('authorization'), env)) {
					return new Response('Unauthorized', { status: 401 });
				}
				let body;

				try {
					body = await request.json();
				} catch {
					return new Response('Invalid JSON body', { status: 400 });
				}

				const { longUrl } = body ?? {};

				if (typeof longUrl !== 'string' || !longUrl.trim() || longUrl.length > 8192) {
					return new Response('Missing or invalid longUrl', {
						status: 400,
					});
				}

				let parsedUrl;

				try {
					parsedUrl = new URL(longUrl);
				} catch {
					return new Response('Invalid URL', { status: 400 });
				}

				if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
					return new Response('Only HTTP and HTTPS URLs are allowed', {
						status: 400,
					});
				}

				// Reuse an existing short link if the URL already exists
				const existing = await env.DB.prepare('SELECT id FROM links WHERE long_url = ?').bind(parsedUrl.href).first();

				let id;

				if (existing) {
					id = existing.id;
				} else {
					const result = await env.DB.prepare('INSERT INTO links (long_url) VALUES (?)').bind(parsedUrl.href).run();

					id = result.meta.last_row_id;
				}

				// Encode database ID to Base62
				const shortCode = encodeBase62(id);
				const shortUrl = `${url.origin}/${shortCode}`;

				return Response.json(
					{
						success: true,
						shortCode,
						shortUrl,
					},
					{
						status: 201,
						headers: { 'Cache-Control': 'no-store' },
					},
				);
			} catch (err) {
				console.error('Create short link failed:', err);

				return new Response('Internal server error', {
					status: 500,
					headers: { 'Cache-Control': 'no-store' },
				});
			}
		}

		return new Response('Method not allowed', {
			status: 405,
			headers: {
				Allow: 'GET, POST',
				'Cache-Control': 'no-store',
			},
		});
	},
};
