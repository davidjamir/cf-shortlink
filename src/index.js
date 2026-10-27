export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const { pathname, searchParams } = url;

		const headers = {
			'Content-Type': 'application/json; charset=utf-8',
			'Cache-Control': 'public, max-age=0, s-maxage=300',
		};

		if (pathname === '/' && request.method === 'GET') {
			return Response.json(
				{
					message: 'API is running!',
					status: 'ok',
					timestamp: new Date().toISOString(),
				},
				{ headers },
			);
		}

		if (pathname === '/api/hello' && request.method === 'GET') {
			const name = searchParams.get('name') || 'World';

			return Response.json(
				{
					message: `Hello ${name}!`,
					timestamp: new Date().toISOString(),
				},
				{ headers },
			);
		}

		if (pathname === '/api/echo' && request.method === 'POST') {
			try {
				const body = await request.json();

				return Response.json(
					{ received: body },
					{
						headers: {
							'Content-Type': 'application/json; charset=utf-8',
							'Cache-Control': 'no-store',
						},
					},
				);
			} catch {
				return Response.json({ error: 'Invalid JSON' }, { status: 400 });
			}
		}

		return Response.json(
			{ error: 'Not Found' },
			{
				status: 404,
				headers: { 'Cache-Control': 'no-store' },
			},
		);
	},
};
