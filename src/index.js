export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const { pathname, searchParams } = url;

		// GET /
		if (pathname === '/' && request.method === 'GET') {
			return Response.json({
				message: 'API is running!',
				status: 'ok',
			});
		}

		// GET /api/hello?name=Viet
		if (pathname === '/api/hello' && request.method === 'GET') {
			const name = searchParams.get('name') || 'World';

			return Response.json({
				message: `Hello ${name}!`,
			});
		}

		// POST /api/echo
		if (pathname === '/api/echo' && request.method === 'POST') {
			try {
				const body = await request.json();

				return Response.json({
					received: body,
				});
			} catch {
				return Response.json({ error: 'Invalid JSON' }, { status: 400 });
			}
		}

		return Response.json({ error: 'Not Found' }, { status: 404 });
	},
};
