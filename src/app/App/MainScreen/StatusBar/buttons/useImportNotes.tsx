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

import { formatNoteLink, formatResourceLink } from '../../../../../core/links';
import { INotesRegistry } from '../../../../../core/Registry';
import { tagsChanged } from '../../../../../core/state/tags';
import { importNotes } from '../../../../../electron/requests/files/renderer';
import {
	useAttachmentsRegistry,
	useFilesRegistry,
	useTagsRegistry,
} from '../../../Providers';

export const replaceUrls = (tree: Root, callback: (url: string) => Promise<string>) => {
	const promises: Promise<any>[] = [];

	visit(tree, ['link', 'image'], (node) => {
		if (node.type !== 'link' && node.type !== 'image') return;

		// Skip not local urls
		const urlRegEx = /^[a-z]+:\/\//;
		if (urlRegEx.test(node.url)) return;

		promises.push(
			callback(node.url).then((url) => {
				node.url = url;
			}),
		);
	});

	return Promise.all(promises);
};

const getRelativePath = (currentPath: string, relativePath: string) => {
	const url = new URL(relativePath, `https://root/${currentPath}`);
	return url.pathname.slice(1);
};

export const useImportNotes = ({
	notesRegistry,
	updateNotes,
}: {
	notesRegistry: INotesRegistry;
	updateNotes: () => void;
}) => {
	const filesRegistry = useFilesRegistry();
	const attachmentsRegistry = useAttachmentsRegistry();
	const tagsRegistry = useTagsRegistry();

	return useCallback(async () => {
		const files = await importNotes();

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

		const filePathToIdMap: Record<string, string> = {};
		const createdNotes: string[] = [];

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
			const attachedFilesIds: string[] = [];
			await replaceUrls(tree, async (nodeUrl) => {
				const absoluteUrl = getRelativePath(filename, nodeUrl);

				// Skip markdown files
				if (absoluteUrl.endsWith('.md')) return absoluteUrl;

				const fileId = await getUploadedFileId(absoluteUrl);
				if (fileId) {
					filePathToIdMap[absoluteUrl] = fileId;

					attachedFilesIds.push(fileId);
					return formatResourceLink(fileId);
				}

				return absoluteUrl;
			});

			// TODO: do not change original note markup (like bullet points marker style, escaping chars)
			const compiledNoteText = markdownProcessor.stringify(tree);
			console.warn({ tree, vFile, noteData, compiledNoteText });

			const filenameSegments = filename.split('/');
			const noteNameWithExt = filenameSegments.slice(-1)[0];
			const noteName = noteNameWithExt.slice(
				0,
				noteNameWithExt.length - fileExtension.length,
			);

			let tagId: null | string = null;
			const tags = await tagsRegistry.getTags();
			const filenameBasePathSegments = filenameSegments.slice(0, -1);
			for (
				let lastSegment = filenameBasePathSegments.length;
				lastSegment > 0;
				lastSegment--
			) {
				const resolvedTagForSearch = filenameBasePathSegments
					.slice(0, lastSegment)
					.join('/');

				const tag = tags.find(
					({ resolvedName }) => resolvedName === resolvedTagForSearch,
				);
				if (tag) {
					if (lastSegment !== filenameBasePathSegments.length) {
						const tagNameToCreate = filenameBasePathSegments
							.slice(lastSegment)
							.join('/');
						tagId = await tagsRegistry.add(tagNameToCreate, tag.id);
						tagsChanged();
					} else {
						tagId = tag.id;
					}
					break;
				}
			}

			if (tagId === null && filenameBasePathSegments.length > 0) {
				const tagNameToCreate = filenameBasePathSegments.join('/');
				tagId = await tagsRegistry.add(tagNameToCreate, null);
				tagsChanged();
			}

			const noteId = await notesRegistry.add({
				title: noteData.title || noteName,
				text: compiledNoteText,
			});

			filePathToIdMap[filename] = noteId;
			createdNotes.push(noteId);

			await attachmentsRegistry.set(
				noteId,
				attachedFilesIds.filter((id, idx, arr) => idx === arr.indexOf(id)),
			);
			await tagsRegistry.setAttachedTags(noteId, tagId ? [tagId] : []);

			// TODO: add method to registry, to emit event by updates
			updateNotes();
		}

		console.warn('Files to ids map', filePathToIdMap);

		for (const noteId of createdNotes) {
			const note = await notesRegistry.getById(noteId);
			if (!note) continue;

			const noteTree = markdownProcessor.parse(note.data.text);
			await replaceUrls(noteTree, async (nodeUrl) => {
				const itemId = filePathToIdMap[decodeURI(nodeUrl)];
				if (!itemId || !createdNotes.includes(itemId)) return nodeUrl;

				return formatNoteLink(itemId);
			});

			const updatedText = markdownProcessor.stringify(noteTree);
			await notesRegistry.update(note.id, { ...note.data, text: updatedText });
		}

		updateNotes();
	}, [attachmentsRegistry, filesRegistry, notesRegistry, tagsRegistry, updateNotes]);
};
