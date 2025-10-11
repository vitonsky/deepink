/* eslint-disable spellcheck/spell-checker */
/* eslint-disable camelcase */
import ort from 'onnxruntime-web';
import { AutoTokenizer } from '@huggingface/transformers';

export class TextEmbeddings {
	constructor(private readonly session: ort.InferenceSession) {}
	async getEmbeddings(texts: string[]) {
		const session = this.session;

		// Tokenize (Transformers.js AutoTokenizer works in browser)
		// We ask for padding/truncation so we receive consistent arrays (input_ids, attention_mask).
		const tokenizer = await AutoTokenizer.from_pretrained(
			'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
		);
		const encoded = await tokenizer(texts, {
			padding: true,
			truncation: true,
			max_length: 128,
			return_tensors: null, // we want plain JS arrays
		});

		// encoded will include input_ids and attention_mask (arrays of numbers)
		// Example shapes: input_ids: [batch, seq_len], attention_mask: [batch, seq_len]
		const inputIdsTensor = encoded.input_ids.ort_tensor as ort.Tensor; // e.g. [[101, ...], [101, ...]]
		const attentionMaskTensor = encoded.attention_mask.ort_tensor as ort.Tensor;

		// some ONNX conversions expect token_type_ids. prepare zeros
		const [batch, seqLen] = inputIdsTensor.dims;
		const tokenTypeTensor = new ort.Tensor(
			'int64',
			BigInt64Array.from(new Array(batch * seqLen).fill(0).map(() => BigInt(0))),
			[batch, seqLen],
		);

		// The exact input names depend on how the ONNX was exported
		const feeds = {
			input_ids: inputIdsTensor,
			attention_mask: attentionMaskTensor,
			token_type_ids: tokenTypeTensor, // only if model requires it
		};

		const results = await session.run(feeds);

		// 5) find output tensor with token embeddings
		// common output name for BERT exports is "last_hidden_state" or something similar — check session.outputNames
		// pick the first output if unsure:
		const firstOutputName = session.outputNames[0];
		const lastHidden = results[firstOutputName]; // ort.Tensor with shape [batch, seq_len, hidden_size]
		// do mean pooling over attention mask to get sentence embeddings (sentence-transformer style)
		const hidden = lastHidden.data; // Float32Array
		const hiddenSize = lastHidden.dims[2];

		// TODO: optimize
		// compute pooled embeddings: for each batch, average token vectors where attention_mask==1
		const embeddings = [];
		for (let b = 0; b < batch; b++) {
			const start = b * seqLen * hiddenSize;
			const sum = new Float32Array(hiddenSize);
			let count = 0;
			for (let t = 0; t < seqLen; t++) {
				const maskVal = attentionMaskTensor.data[b][t];
				if (maskVal === 0) continue;
				count++;
				const tokenOffset = start + t * hiddenSize;
				for (let h = 0; h < hiddenSize; h++) sum[h] += hidden[tokenOffset + h];
			}
			if (count === 0) count = 1;
			for (let h = 0; h < hiddenSize; h++) sum[h] /= count;
			embeddings.push(Array.from(sum));
		}

		return embeddings; // array of [hidden_size] floats per input text
	}
}
