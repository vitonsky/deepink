/* eslint-disable spellcheck/spell-checker */
/* eslint-disable camelcase */
import * as ort from 'onnxruntime-web';
import { NodeFS } from '@core/features/files/NodeFS';
import { proxyResponse } from '@utils/network/proxyResponse';

import { CacheableBuffer } from './CacheableBuffer';
import { TextEmbeddings } from './TextEmbeddings';
import { cosineSimilarity } from './utils';

// optional: pick execution provider; use 'wasm' or 'webgpu' (if supported).
ort.env.wasm.numThreads = 2; // tweak if you want (see docs)

const fetcher = new CacheableBuffer(new NodeFS({ root: './tmp/.cache' }), {
	'model.onnx': () =>
		fetch(
			'https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/resolve/main/onnx/model.onnx?download=true',
		)
			.then((response) =>
				proxyResponse(response, {
					onChunk({ totalBytes, readBytes }) {
						const progress = totalBytes ? (readBytes / totalBytes) * 100 : 0;
						console.log(
							`Download progress: ${progress.toFixed(
								2,
							)}% (${readBytes} bytes)`,
						);
					},
				}),
			)
			.then((r) => (r.ok ? r.arrayBuffer() : null)),
});

// Preload model for tests
beforeAll(async () => {
	await fetcher.get('model.onnx');
}, 100_000);

// quick usage
test('Texts similarity must have sense', async () => {
	const model = await fetcher.get('model.onnx');
	if (!model) throw new Error('Model not found');

	const session = await ort.InferenceSession.create(model, {
		executionProviders: ['wasm'],
	});

	const start = performance.now();

	const [
		definition,
		simplifiedTextInTheSameLanguage,
		simplifiedText,
		similarText,
		farMeaning,
	] = await new TextEmbeddings(session).getEmbeddings([
		`Зако́н то́ждества — принцип постоянства, или принцип сохранности предметного и смыслового значений суждений (высказываний) в некотором заведомо известном или подразумеваемом контексте (в выводе, доказательстве, теории)[1]. Является одним из законов классической логики.

		В процессе рассуждения каждое понятие, суждение должно употребляться в одном и том же смысле. Предпосылкой этого является возможность различения и отождествления тех объектов, о которых идёт речь[2]. Мысль о предмете должна иметь определённое, устойчивое содержание, сколько бы раз она ни повторялась. Важнейшее свойство мышления — его определённость — выражается данным логическим законом[3][4][5][6].

		Впервые[4] закон тождества сформулирован Аристотелем в трактате «Метафизика» следующим образом:

			«…иметь не одно значение — значит не иметь ни одного значения; если же у слов нет значений, тогда утрачена всякая возможность рассуждать друг с другом, а в действительности — и с самим собой; ибо невозможно ничего мыслить, если не мыслить что-нибудь одно»
			— Аристотель, «Метафизика»[7]`,
		'Сохранение смысла',
		'Meaning consistency',
		'Equality',
		'Animal',
	]);
	// console.log('embeddings:', embs);

	console.log('Infer time', performance.now() - start);

	console.log(
		'Similarity',
		cosineSimilarity(definition, simplifiedText),
		cosineSimilarity(simplifiedText, farMeaning),
	);

	expect(cosineSimilarity(definition, simplifiedTextInTheSameLanguage)).toBeGreaterThan(
		cosineSimilarity(definition, simplifiedText),
	);

	expect(cosineSimilarity(definition, simplifiedText)).toBeGreaterThan(
		cosineSimilarity(definition, similarText),
	);

	expect(cosineSimilarity(definition, similarText)).toBeGreaterThan(
		cosineSimilarity(definition, farMeaning),
	);

	expect(cosineSimilarity(simplifiedText, similarText)).toBeGreaterThan(
		cosineSimilarity(simplifiedText, farMeaning),
	);
});
