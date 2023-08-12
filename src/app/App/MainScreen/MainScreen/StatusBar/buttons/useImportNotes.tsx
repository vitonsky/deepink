import { useCallback } from 'react';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { Root } from 'remark-parse/lib';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { remove } from 'unist-util-remove';
import { visit } from 'unist-util-visit';

import { formatResourceLink } from '../../../../../../core/links';
import { INotesRegistry } from '../../../../../../core/Registry';
import { exportNotes } from '../../../../../../electron/requests/files/renderer';
import { useFilesRegistry } from '../../../../Providers';

export const replaceUrls = (tree: Root, callback: (url: string) => Promise<string>) => {
	const promises: Promise<any>[] = [];

	visit(tree, ['link', 'image'], (node) => {
		if (node.type !== 'link' && node.type !== 'image') return;

		// Skip not local urls
		const urlRegEx = /^[a-z]+:\/\//;
		if (urlRegEx.test(node.url)) return;

		promises.push(callback(node.url).then((url) => {
			node.url = url;
		}));
	});

	return Promise.all(promises);
};

const getRelativePath = (currentPath: string, relativePath: string) => {
	const url = new URL(relativePath, `https://root/${currentPath}`);
	return url.pathname.slice(1);
};

export const useImportNotes = ({ notesRegistry, updateNotes }: {
	notesRegistry: INotesRegistry;
	updateNotes: () => void;
}) => {
	const filesRegistry = useFilesRegistry();
	return useCallback(async () => {
		const files = await exportNotes();

		console.warn('Files', files);

		const uploadedFiles: Record<string, Promise<string | null>> = {};
		const getUploadedFileId = async (url: string) => {
			const urlRealPath = decodeURI(url);

			// Upload new files
			if (!(urlRealPath in uploadedFiles)) {
				uploadedFiles[urlRealPath] = (async () => {
					const buffer = files[urlRealPath];
					if (!buffer) return null;

					const urlFilename = urlRealPath.split('/').slice(-1)[0];
					const file = new File([buffer], urlFilename);

					return filesRegistry.add(file);
				})();
			}

			return uploadedFiles[urlRealPath];
		};

		const textDecoder = new TextDecoder('utf-8');
		const markdownProcessor = unified()
			.use(remarkParse)
			.use(remarkParseFrontmatter)
			.use(remarkFrontmatter, ['yaml', 'toml'])
			.use(remarkGfm)
			.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
			.freeze();

		// Handle markdown files
		for (const filename in files) {
			// Skip not markdown files
			const fileExtension = '.md';
			if (!filename.endsWith(fileExtension)) continue;

			const fileBuffer = files[filename];
			const noteText = textDecoder.decode(fileBuffer);

			const vFile = markdownProcessor.processSync(noteText);
			const noteData = vFile.data.frontmatter as any;

			const tree = markdownProcessor.parse(noteText);

			// Remove header node with meta data parsed by frontmatter
			remove(tree, 'yaml');

			// Replace URLs to uploaded entities
			// TODO: update references to another md files
			await replaceUrls(tree, async (nodeUrl) => {
				const url = getRelativePath(filename, nodeUrl);
				const fileId = await getUploadedFileId(url);
				return fileId ? formatResourceLink(fileId) : nodeUrl;
			});

			// TODO: do not change original note markup (like bullet points marker style, escaping chars)
			const compiledNoteText = markdownProcessor.stringify(tree);
			console.warn({ tree, vFile, noteData, compiledNoteText });

			const noteNameWithExt = filename.split('/').slice(-1)[0];
			const noteName = noteNameWithExt.slice(0, noteNameWithExt.length - fileExtension.length);

			// TODO: attach tags with full hierarchy
			await notesRegistry.add({
				title: noteData.title || noteName,
				text: compiledNoteText,
			});

			// TODO: add method to registry, to emit event by updates
			updateNotes();
		}

		updateNotes();
	}, [filesRegistry, notesRegistry, updateNotes]);
};
