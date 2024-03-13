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
import { formatNoteLink, formatResourceLink } from '@core/features/links';
import { INotesController } from '@core/features/notes/controller';
import { findParentTag, isTagsArray } from '@core/features/tags/utils';
import { importNotes } from '@electron/requests/files/renderer';
import {
	useAttachmentsController,
	useFilesRegistry,
	useTagsRegistry,
	useWorkspaceContext,
} from '@features/Workspace/WorkspaceProvider';

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
	notesRegistry: INotesController;
	updateNotes: () => void;
}) => {
	const { events: workspaceEvents } = useWorkspaceContext();

	const filesRegistry = useFilesRegistry();
	const attachmentsRegistry = useAttachmentsController();
	const tagsRegistry = useTagsRegistry();

	// TODO: transparent encrypt files and upload to a temporary directory, instead of keep in memory
	return useCallback(async () => {
		const filesBuffers = await importNotes();

		const textDecoder = new TextDecoder('utf-8');
		const markdownProcessor = unified()
			.use(remarkParse)
			.use(remarkParseFrontmatter)
			.use(remarkFrontmatter, ['yaml', 'toml'])
			.use(remarkGfm)
			.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
			.freeze();

		const attachmentsToUpload: string[] = [];
		const createdNotes: Record<string, { id: string; path: string }> = {};

		// Extraction: On this step we just parse and format data
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

			// Update URLs in AST and collect attachments
			await replaceUrls(mdTree, async (nodeUrl) => {
				const absoluteUrl = getAbsolutePathOfRelativePath(filename, nodeUrl);

				// Collect attachments URLs
				if (!isNotePath(absoluteUrl, resourcesDirectories)) {
					attachmentsToUpload.push(absoluteUrl);
				}

				return absoluteUrl;
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

			// TODO: mark as temporary and don't show for user
			const noteId = await notesRegistry.add({
				title: noteTitle,
				text: noteText,
			});

			// Attach tags
			if (isTagsArray(noteData.tags) && noteData.tags.length > 0) {
				const tagsToAttach: string[] = [];
				for (const resolvedTagName of noteData.tags) {
					const tags = await tagsRegistry.getTags();

					// Find exists tag
					const foundTag = tags.find(
						(tag) => tag.resolvedName === resolvedTagName,
					);
					if (foundTag) {
						tagsToAttach.push(foundTag.id);
						continue;
					}

					// Find parent tag and create sub tag
					const parentTag = findParentTag(resolvedTagName, tags);
					if (parentTag) {
						const parentTagWithPrefixLength =
							parentTag.resolvedName.length + 1;
						const tagNamePartToAdd = resolvedTagName.slice(
							parentTagWithPrefixLength,
						);
						const createdTagId = await tagsRegistry.add(
							tagNamePartToAdd,
							parentTag.id,
						);
						workspaceEvents.tagsUpdateRequested();
						tagsToAttach.push(createdTagId);
						continue;
					}

					// Create full resolved tag
					const createdTagId = await tagsRegistry.add(resolvedTagName, null);
					workspaceEvents.tagsUpdateRequested();
					tagsToAttach.push(createdTagId);
				}

				if (tagsToAttach.length > 0) {
					await tagsRegistry.setAttachedTags(noteId, tagsToAttach);
				}
			}

			createdNotes[encodeURI(filename)] = {
				id: noteId,
				path: filenameSegments.slice(0, -1).join('/'),
			};

			// TODO: add method to registry, to emit event by updates
			updateNotes();
		}

		// Uploading: On this stage we upload any files
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

		/**
		 * Map structure: file URL => entity ID
		 * We use file URL, not a path, because links in MD contains encoded URLs, not a paths,
		 * So we have to decode URLs if needs to use it as paths.
		 */
		const fileUrlToIdMap: Record<string, string> = {};

		// Upload attached files
		await Promise.all(
			attachmentsToUpload
				// Remove duplicates
				.filter((url, index, arr) => index === arr.indexOf(url))
				.map(async (absoluteUrl) => {
					const fileId = await getUploadedFileId(absoluteUrl);
					if (fileId) {
						fileUrlToIdMap[absoluteUrl] = fileId;
					}
				}),
		);

		// Linking: On this stage all attachments (like files, other notes, etc) uploaded and ready to use
		// Update notes
		for (const [_fileUrl, noteData] of Object.entries(createdNotes)) {
			const noteId = noteData.id;
			const note = await notesRegistry.getById(noteId);
			if (!note) continue;

			const noteTree = markdownProcessor.parse(note.content.text);

			// Update URLs
			const attachedFilesIds: string[] = [];
			await replaceUrls(noteTree, async (absoluteUrl) => {
				const createdNote = createdNotes[absoluteUrl];
				if (createdNote) {
					return formatNoteLink(createdNote.id);
				}

				const fileId = fileUrlToIdMap[absoluteUrl];
				if (fileId) {
					attachedFilesIds.push(fileId);
					return formatResourceLink(fileId);
				}

				return absoluteUrl;
			});

			// Update note text
			const updatedText = markdownProcessor.stringify(noteTree);
			await notesRegistry.update(note.id, { ...note.content, text: updatedText });

			// Attach files
			await attachmentsRegistry.set(
				noteId,
				attachedFilesIds.filter((id, idx, arr) => idx === arr.indexOf(id)),
			);

			// Find or create tags and attach
			let tagId: null | string = null;
			const tags = await tagsRegistry.getTags();
			const filenameBasePathSegments = noteData.path.split('/');
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
				workspaceEvents.tagsUpdateRequested();

				break;
			}

			if (tagId === null && filenameBasePathSegments.length > 0) {
				const tagNameToCreate = filenameBasePathSegments.join('/').trim();
				if (tagNameToCreate) {
					tagId = await tagsRegistry.add(tagNameToCreate, null);
					workspaceEvents.tagsUpdateRequested();
				}
			}

			// Add tag based on path
			const attachedTags = await tagsRegistry
				.getAttachedTags(noteId)
				.then((tags) => tags.map((tag) => tag.id));
			if (tagId) {
				attachedTags.push(tagId);
			}
			await tagsRegistry.setAttachedTags(noteId, attachedTags);
		}

		updateNotes();
	}, [
		attachmentsRegistry,
		filesRegistry,
		notesRegistry,
		tagsRegistry,
		updateNotes,
		workspaceEvents,
	]);
};
