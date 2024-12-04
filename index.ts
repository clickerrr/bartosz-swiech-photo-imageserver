import { readdirSync } from 'fs';
import { extname } from 'path';
import { serve } from 'bun';

import { readFileSync } from 'fs';
import { join } from 'path';

// Define the structure of API responses
interface ApiResponse {
	images?: string[];
	error?: string;
	details?: string;
}

// Function to fetch all images from a directory
function fetchImages(directory: string): string[] {
	const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']; // Add more extensions if needed
	try {
		const files = readdirSync(directory);
		return files.filter((file) => imageExtensions.includes(extname(file).toLowerCase()));
	} catch (error) {
		throw new Error(`Failed to read directory: ${error.message}`);
	}
}

function fetchDirectories(): string[] {
	try {
		const directories = readdirSync('./public/images');
		return directories;
	} catch (error) {
		throw new Error(`Failed to read directory: ${error.message}`);
	}
}

// Start the Bun HTTP server
const server = serve({
	port: 3000,
	fetch(req: Request): Response {
		const url = new URL(req.url);

		if (url.pathname === '/directories') {
			try {
				const directories = fetchDirectories();
				return new Response(JSON.stringify(directories), {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
					status: 200,
				});
			} catch (error: unknown) {
				const response: ApiResponse = {
					error: 'Failed to fetch images',
					details: error instanceof Error ? error.message : String(error),
				};
				return new Response(JSON.stringify(response), {
					headers: { 'Content-Type': 'application/json' },
					status: 500,
				});
			}
		}

		if (url.pathname.startsWith('/imagelist/')) {
			// Specify your images directory

			const imageDirectory = './public/images';
			console.log(url.pathname.split('/imagelist/')[1]);
			const dirName = url.pathname.split('/imagelist/')[1];
			const dirPath = join(imageDirectory, dirName);

			try {
				const images = fetchImages(dirPath);
				const response: ApiResponse = { images };
				return new Response(JSON.stringify(response), {
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					},
					status: 200,
				});
			} catch (error: unknown) {
				const response: ApiResponse = {
					error: 'Failed to fetch images',
					details: error instanceof Error ? error.message : String(error),
				};
				return new Response(JSON.stringify(response), {
					headers: { 'Content-Type': 'application/json' },
					status: 500,
				});
			}
		}

		// Serve individual image files
		if (url.pathname.startsWith('/images/')) {
			const imageDirectory = './public/images';
			const imageName = url.pathname.split('/images/')[1];
			const imagePath = join(imageDirectory, imageName);

			try {
				// Read the image file
				const image = readFileSync(imagePath);
				const extension = extname(imageName).toLowerCase();
				const mimeTypes: { [key: string]: string } = {
					'.jpg': 'image/jpeg',
					'.jpeg': 'image/jpeg',
					'.png': 'image/png',
					'.gif': 'image/gif',
					'.webp': 'image/webp',
				};

				const mimeType = mimeTypes[extension];
				if (!mimeType) {
					return new Response('Unsupported image format', { status: 415 });
				}

				return new Response(image, {
					headers: {
						'Content-Type': mimeType,
						'Cache-Control': 'public, max-age=3600', // Optional caching
						'Access-Control-Allow-Origin': '*',
					},
					status: 200,
				});
			} catch (error: unknown) {
				const response: ApiResponse = {
					error: 'Image not found',
					details: error instanceof Error ? error.message : String(error),
				};
				return new Response(JSON.stringify(response), {
					headers: { 'Content-Type': 'application/json' },
					status: 404,
				});
			}
		}

		return new Response('Not Found', { status: 404 });
	},
});

console.log(`Server is running on http://localhost:${server.port}`);
