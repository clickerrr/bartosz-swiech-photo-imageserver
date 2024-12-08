import { readdirSync } from 'fs';
import { extname } from 'path';
import { serve } from 'bun';

import { readFileSync } from 'fs';
import { join } from 'path';
import { Elysia } from 'elysia';

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

function fetchDirectories(directory: string): string[] {
	try {
		const directories = readdirSync(directory);
		return directories;
	} catch (error) {
		console.log(error);
		throw new Error(`Failed to read directory: ${error.message}`);
	}
}

const app = new Elysia()
	.get('/directories', ({ set }) => {
		try {
			const directories = fetchDirectories('./public/images');

			set.status = 200;
			set.headers['Content-Type'] = 'application/json';
			set.headers['Access-Control-Allow-Origin'] = '*';
			return directories;
		} catch (error: unknown) {
			const response: ApiResponse = {
				error: 'Failed to fetch images',
				details: error instanceof Error ? error.message : String(error),
			};
			set.status = 404;
			return response;
		}
	})
	.get('/imagelist/:directory', ({ params, set }) => {
		console.log(params);
		const dirPath = join('./public/images', params.directory);
		try {
			const images = fetchImages(dirPath);
			const response: ApiResponse = { images };
			set.status = 200;
			set.headers['Content-Type'] = 'application/json';
			set.headers['Access-Control-Allow-Origin'] = '*';
			return response;
		} catch (error: unknown) {
			const response: ApiResponse = {
				error: 'Failed to fetch images',
				details: error instanceof Error ? error.message : String(error),
			};
			set.status = 404;
			return response;
		}
	})
	.get('/images/:category/:imageName', ({ params, set }) => {
		const imagePath = join('./public/images', params.category, params.imageName);

		try {
			// Read the image file
			const image = readFileSync(imagePath);
			const extension = extname(params.imageName).toLowerCase();
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

			set.headers['Content-Type'] = mimeType;
			set.headers['Cache-Control'] = 'public, max-age=3600';
			set.headers['Access-Control-Allow-Origin'] = '*';
			set.status = 200;
			return image;
		} catch (error: unknown) {
			const response: ApiResponse = {
				error: 'Image not found',
				details: error instanceof Error ? error.message : String(error),
			};
			return response;
		}
	})
	.get('/catalogs', ({ set }) => {
		try {
			const catalogs = fetchDirectories('./public/catalogs');
			set.status = 200;
			set.headers['Content-Type'] = 'application/json';
			set.headers['Access-Control-Allow-Origin'] = '*';
			return catalogs;
		} catch (error: unknown) {
			console.log(error);
			const response: ApiResponse = {
				error: 'Resource not found',
				details: error instanceof Error ? error.message : String(error),
			};
			return response;
		}
	})
	.get('/catalogs/:catalogName', ({ params, set }) => {
		const name = params.catalogName;
		try {
			const filePath = join('./public/catalogs', name);
			const fileResult = readFileSync(filePath);
			set.headers['Content-Type'] = 'application/json';
			set.headers['Access-Control-Allow-Origin'] = '*';
			set.status = 200;
			return fileResult;
		} catch (error: unknown) {
			const response: ApiResponse = {
				error: 'Resource not found',
				details: error instanceof Error ? error.message : String(error),
			};
			set.status = 404;
			return response;
		}
	})
	.listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
