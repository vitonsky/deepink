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

const getAbsolutePathOfRelativePath = (currentPath: string, relativePath: string) => {
	const url = new URL(relativePath, `https://root/${currentPath}`);
	return url.pathname.slice(1);
};

const isNotePath = (filePath: string, resourcesDirs: string[] = []) =>
	filePath.endsWith('.md') &&
	resourcesDirs.every((dirPath) => !filePath.startsWith(dirPath));

const resourcesDirectories = ['_resources'];

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

	// TODO: transparent encrypt files and upload to a temporary directory, instead of keep in memory
	return useCallback(async () => {
		const filesBuffers = await importNotes();

		const uploadedFiles: Record<string, Promise<string | null>> = {};

		/**
		 * Uploads a file and returns file id.
		 * Returns file id instant, for already uploaded files in current import session
		 */
		const getUploadedFileId = async (url: string) => {
			const urlRealPath = decodeURI(url);

			// Upload new files
			if (!(urlRealPath in uploadedFiles)) {
				uploadedFiles[urlRealPath] = (async () => {
					const buffer = filesBuffers[urlRealPath];
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

		/**
		 * Map structure: file URL => entity ID
		 * We use file URL, not a path, because links in MD contains encoded URLs, not a paths,
		 * So we have to decode URLs if needs to use it as paths.
		 */
		const fileUrlToIdMap: Record<string, string> = {};
		const createdNoteIds: string[] = [];

		// Import notes
		for (const filename in filesBuffers) {
			// Handle only notes
			if (!isNotePath(filename, resourcesDirectories)) continue;

			const filenameSegments = filename.split('/');
			const fileBuffer = filesBuffers[filename];
			const sourceNoteData = textDecoder.decode(fileBuffer);

			const mdTree = markdownProcessor.parse(sourceNoteData);

			// Remove header node with meta data parsed by frontmatter
			remove(mdTree, 'yaml');

			// Upload attachments and update URLs in AST
			const attachedFilesIds: string[] = [];
			await replaceUrls(mdTree, async (nodeUrl) => {
				const absoluteUrl = getAbsolutePathOfRelativePath(filename, nodeUrl);

				// Skip notes, handle only attachments
				if (isNotePath(absoluteUrl, resourcesDirectories)) return absoluteUrl;

				const fileId = await getUploadedFileId(absoluteUrl);
				if (!fileId) return absoluteUrl;

				fileUrlToIdMap[absoluteUrl] = fileId;

				attachedFilesIds.push(fileId);
				return formatResourceLink(fileId);
			});

			// Add note draft
			// TODO: validate data
			const noteData = markdownProcessor.processSync(sourceNoteData).data
				.frontmatter as Record<string, string>;
			let noteTitle = noteData.title || null;
			if (noteTitle === null) {
				const noteNameWithExt = filenameSegments.slice(-1)[0];
				noteTitle = noteNameWithExt.replace(/\.md$/iu, '');
			}

			// TODO: do not change original note markup (like bullet points marker style, escaping chars)
			const noteText = markdownProcessor.stringify(mdTree);

			const noteId = await notesRegistry.add({
				title: noteTitle,
				text: noteText,
			});

			fileUrlToIdMap[filename] = noteId;
			createdNoteIds.push(noteId);

			// Attach files
			await attachmentsRegistry.set(
				noteId,
				attachedFilesIds.filter((id, idx, arr) => idx === arr.indexOf(id)),
			);

			// Find or create tags and attach
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

				if (!tag) continue;

				const isFullPathExists = lastSegment === filenameBasePathSegments.length;
				if (isFullPathExists) {
					// Tag found
					tagId = tag.id;
					break;
				}

				// Create nested tags
				const parentTagId = tag.id;
				const tagNameToCreate = filenameBasePathSegments
					.slice(lastSegment)
					.join('/');

				tagId = await tagsRegistry.add(tagNameToCreate, parentTagId);
				tagsChanged();

				break;
			}

			if (tagId === null && filenameBasePathSegments.length > 0) {
				const tagNameToCreate = filenameBasePathSegments.join('/');
				tagId = await tagsRegistry.add(tagNameToCreate, null);
				tagsChanged();
			}

			await tagsRegistry.setAttachedTags(noteId, tagId ? [tagId] : []);

			// TODO: add method to registry, to emit event by updates
			updateNotes();
		}

		// Update notes
		for (const noteId of createdNoteIds) {
			const note = await notesRegistry.getById(noteId);
			if (!note) continue;

			const noteTree = markdownProcessor.parse(note.data.text);
			await replaceUrls(noteTree, async (nodeUrl) => {
				const itemId = fileUrlToIdMap[decodeURI(nodeUrl)];
				if (!itemId || !createdNoteIds.includes(itemId)) return nodeUrl;

				return formatNoteLink(itemId);
			});

			const updatedText = markdownProcessor.stringify(noteTree);
			await notesRegistry.update(note.id, { ...note.data, text: updatedText });
		}

		updateNotes();
	}, [attachmentsRegistry, filesRegistry, notesRegistry, tagsRegistry, updateNotes]);
};
