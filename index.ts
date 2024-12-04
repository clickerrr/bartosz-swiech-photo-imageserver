const server = Bun.serve({
	port: 3000,
	fetch(req) {
		return new Response('Bun!', {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		});
	},
});

console.log(`Listening on http://localhost:${server.port} ...`);
