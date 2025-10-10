export const proxyResponse = (
	response: Response,
	{
		onChunk,
	}: {
		onChunk?: (info: { totalBytes: number; readBytes: number }) => void;
	},
) => {
	if (!response.body) return response;

	const contentLength = response.headers.get('Content-Length');
	const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;
	let readBytes = 0;

	const reader = response.body.getReader();
	const stream = new ReadableStream({
		async start(controller) {
			while (true) {
				const { done, value } = await reader.read();
				if (done) {
					break;
				}

				// Count bytes
				if (onChunk) {
					readBytes += value.length;
					onChunk({ totalBytes, readBytes });
				}

				controller.enqueue(value);
			}
			controller.close();
		},
	});

	return new Response(stream, {
		headers: response.headers,
		status: response.status,
		statusText: response.statusText,
	});
};
