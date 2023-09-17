export const joinArrayBuffers = (buffers: ArrayBuffer[]) => {
	const bufferLen = buffers.reduce((len, buffer) => len + buffer.byteLength, 0);
	const resultBuffer = new Uint8Array(bufferLen);

	let offset = 0;
	for (const buffer of buffers) {
		resultBuffer.set(new Uint8Array(buffer), offset);
		offset += buffer.byteLength;
	}

	return resultBuffer.buffer;
};
