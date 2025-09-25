import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { remove } from 'unist-util-remove';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { formatNoteLink, formatResourceLink } from '@core/features/links';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { findParentTag, isTagsArray } from '@core/features/tags/utils';
import { getPathSegments, getResolvedPath, joinPathSegments } from '@utils/fs/paths';

import { replaceUrls } from '../utils/mdast';

// Map with files where key is a path and value is a content buffer
export type FilesMap = Record<string, ArrayBuffer>;

const isNotePath = (filePath: string, resourcesDirs: string[] = []) =>
	filePath.endsWith('.md') &&
	resourcesDirs.every((dirPath) => !filePath.startsWith(dirPath));

const resourcesDirectories = ['/_resources'];

// TODO: refactor the code
// TODO: snapshot history for every note
export class NotesImporter {
	constructor(
		private readonly storage: {
			notesRegistry: INotesController;
			tagsRegistry: TagsController;
			filesRegistry: FilesController;
			attachmentsRegistry: AttachmentsController;
		},
		private readonly options: { onUpdate?: () => void } = {},
	) {}

	public async import(filesBuffers: FilesMap) {
		const { notesRegistry, tagsRegistry, filesRegistry, attachmentsRegistry } =
			this.storage;
		const updateNotes = this.options.onUpdate ?? (() => {});

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
				const absoluteUrl = getResolvedPath(
					nodeUrl,
					getPathSegments(filename).dirname,
				);

				// Return original URL if file does not exist
				if (!(absoluteUrl in filesBuffers)) return nodeUrl;

				// Collect attachments URLs
				if (!isNotePath(absoluteUrl, resourcesDirectories)) {
					attachmentsToUpload.push(absoluteUrl);
				}

				return absoluteUrl;
			});

			// Add note draft
			// TODO: validate data
			const noteData = (markdownProcessor.processSync(sourceNoteData).data
				.frontmatter ?? {}) as Record<string, string>;
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
				await tagsRegistry.setAttachedTags(
					noteId,
					await this.getTagIds(noteData.tags),
				);
			}

			createdNotes[encodeURI(filename)] = {
				id: noteId,
				path: getPathSegments(joinPathSegments(filenameSegments)).dirname,
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
				const createdNote = createdNotes[encodeURI(absoluteUrl)];
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
			const pathWithRemovedRoot = noteData.path.slice(1);
			if (pathWithRemovedRoot.length > 0) {
				await tagsRegistry.setAttachedTags(
					noteId,
					await Promise.all([
						tagsRegistry
							.getAttachedTags(noteId)
							.then((tags) => tags.map((tag) => tag.id)),
						this.getTagIds([pathWithRemovedRoot]),
					]).then((tagIds) => tagIds.flat()),
				);
			}
		}

		updateNotes();
	}

	private async getTagIds(tags: string[]) {
		const { tagsRegistry } = this.storage;

		const tagsToAttach: string[] = [];
		for (const resolvedTagName of tags) {
			const tags = await tagsRegistry.getTags();

			// Find exists tag
			const foundTag = tags.find((tag) => tag.resolvedName === resolvedTagName);
			if (foundTag) {
				tagsToAttach.push(foundTag.id);
				continue;
			}

			// Find parent tag and create sub tag
			const parentTag = findParentTag(resolvedTagName, tags);
			if (parentTag) {
				const parentTagWithPrefixLength = parentTag.resolvedName.length + 1;
				const tagNamePartToAdd = resolvedTagName.slice(parentTagWithPrefixLength);
				const createdTagId = await tagsRegistry.add(
					tagNamePartToAdd,
					parentTag.id,
				);
				tagsToAttach.push(createdTagId);
				continue;
			}

			// Create full resolved tag
			const createdTagId = await tagsRegistry.add(resolvedTagName, null);
			tagsToAttach.push(createdTagId);
		}

		return tagsToAttach;
	}
}
