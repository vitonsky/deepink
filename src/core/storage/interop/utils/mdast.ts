import { Root } from 'mdast';
import { visit } from 'unist-util-visit';

export const replaceUrls = (
	tree: Root,
	callback: (url: string) => Promise<string>,
	handleUrlType = false,
) => {
	const promises: Promise<any>[] = [];

	visit(tree, ['link', 'image'], (node) => {
		if (node.type !== 'link' && node.type !== 'image') return;

		// Skip not local urls
		const urlRegEx = /^[a-z]+:\/\//;
		const isUrlType = urlRegEx.test(node.url);
		if (isUrlType && !handleUrlType) return;

		promises.push(
			callback(node.url).then((url) => {
				node.url = url;
			}),
		);
	});

	return Promise.all(promises);
};
