import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { remove } from 'unist-util-remove';
import { z } from 'zod';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { IFilesStorage } from '@core/features/files';
import { FilesController } from '@core/features/files/FilesController';
import { formatNoteLink, formatResourceLink } from '@core/features/links';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { findParentTag } from '@core/features/tags/utils';
import { getPathSegments, getResolvedPath } from '@utils/fs/paths';

import { replaceUrls } from '../utils/mdast';

// Map with files where key is a path and value is a content buffer
export type FilesMap = Record<string, ArrayBuffer>;

const isNotePath = (filePath: string, resourcesDirs: string[] = []) =>
	filePath.endsWith('.md') &&
	resourcesDirs.every((dirPath) => !filePath.startsWith(dirPath));

const resourcesDirectories = ['/_resources'];
const RawNoteMetaScheme = z
	.object({
		title: z.string().trim().min(1).optional().catch(undefined),
		tags: z
			.string()
			.array()
			.transform((tags) => tags.map((tag) => tag.trim()).filter(Boolean))
			.optional()
			.catch(undefined),
	})
	.catch({});

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

	public async import(files: IFilesStorage) {
		const { notesRegistry, tagsRegistry, attachmentsRegistry } = this.storage;
		const updateNotes = this.options.onUpdate ?? (() => {});

		const textDecoder = new TextDecoder('utf-8');
		const markdownProcessor = unified()
			.use(remarkParse)
			.use(remarkParseFrontmatter)
			.use(remarkFrontmatter, ['yaml', 'toml'])
			.use(remarkGfm)
			.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
			.freeze();

		const createdNotes: Record<string, { id: string; path: string }> = {};
		const attachmentPathsToUpload: string[] = [];

		// Extraction: On this step we just parse and format data
		// Import notes
		const filePathsList = await files.list();
		for (const filename of filePathsList) {
			// Handle only notes
			if (!isNotePath(filename, resourcesDirectories)) continue;

			const fileContent = await files.get(filename);
			if (!fileContent) continue;

			const rawText = textDecoder.decode(fileContent);
			const fileAbsolutePathSegments = getPathSegments(filename);

			const mdTree = markdownProcessor.parse(rawText);

			// Remove header node with meta data parsed by frontmatter
			remove(mdTree, 'yaml');

			// Resolve URLs to absolute paths in AST and collect attachments in use
			await replaceUrls(mdTree, async (nodeUrl) => {
				const absolutePath = getResolvedPath(
					nodeUrl,
					fileAbsolutePathSegments.dirname,
				);

				// Return original URL if file does not exist in files for import
				if (!filePathsList.includes(absolutePath)) return nodeUrl;

				// Collect attachments URLs
				if (!isNotePath(absolutePath, resourcesDirectories)) {
					attachmentPathsToUpload.push(absolutePath);
				}

				return absolutePath;
			});

			// Add note draft
			const noteMeta = RawNoteMetaScheme.parse(
				markdownProcessor.processSync(rawText).data.frontmatter,
			);

			// TODO: do not change original note markup (like bullet points marker style, escaping chars)
			const noteText = markdownProcessor.stringify(mdTree);

			// TODO: mark as temporary and don't show for user
			const noteId = await notesRegistry.add({
				title:
					noteMeta.title ??
					fileAbsolutePathSegments.basename.replace(/\.md$/iu, ''),
				text: noteText,
			});

			// Attach tags
			if (noteMeta.tags && noteMeta.tags.length > 0) {
				await tagsRegistry.setAttachedTags(
					noteId,
					await this.getTagIds(noteMeta.tags),
				);
			}

			createdNotes[filename] = {
				id: noteId,
				path: fileAbsolutePathSegments.dirname,
			};

			// TODO: add method to registry, to emit event by updates
			updateNotes();
		}

		// Uploading: On this stage we upload any files
		/**
		 * Map structure: file URL => entity ID
		 * We use file URL, not a path, because links in MD contains encoded URLs, not a paths,
		 * So we have to decode URLs if needs to use it as paths.
		 */
		const filePathToIdMap: Record<string, string> = {};

		// Upload attached files
		await Promise.all(
			// Remove duplicates
			Array.from(new Set(attachmentPathsToUpload)).map(async (absoluteUrl) => {
				const fileId = await this.getFileId(absoluteUrl, files);
				if (fileId) {
					filePathToIdMap[absoluteUrl] = fileId;
				}
			}),
		);

		// Linking: On this stage all attachments (like files, other notes, etc) uploaded and ready to use
		// Update notes
		for (const { id: noteId, path: noteDirPath } of Object.values(createdNotes)) {
			const note = await notesRegistry.getById(noteId);
			if (!note) throw new Error('Note with such id does not exist');

			const noteTree = markdownProcessor.parse(note.content.text);

			// Update URLs and collect attached files
			const attachedFilesIds = new Set<string>();
			await replaceUrls(noteTree, async (absoluteUrl) => {
				const createdNote = createdNotes[absoluteUrl];
				if (createdNote) {
					// TODO: record back-link to note
					return formatNoteLink(createdNote.id);
				}

				const fileId = filePathToIdMap[absoluteUrl];
				if (fileId) {
					// Record file id as used
					attachedFilesIds.add(fileId);

					return formatResourceLink(fileId);
				}

				return absoluteUrl;
			});

			// Update note text
			const updatedText = markdownProcessor.stringify(noteTree);
			await notesRegistry.update(note.id, { ...note.content, text: updatedText });

			// Attach files
			await attachmentsRegistry.set(noteId, Array.from(attachedFilesIds));

			// Attach tag equal to note directory path
			if (noteDirPath !== '/') {
				const attachedTagIds = await tagsRegistry
					.getAttachedTags(noteId)
					.then((tags) => tags.map((tag) => tag.id));

				const tagName = noteDirPath.split('/').filter(Boolean).join('/');
				const [pathTagId] = await this.getTagIds([tagName]);

				await tagsRegistry.setAttachedTags(noteId, [
					...attachedTagIds,
					pathTagId,
				]);
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

	private readonly uploadedFiles: Record<string, Promise<string | null>> = {};
	/**
	 * Returns file id by its path. Uploads file if not uploaded yet
	 */
	async getFileId(url: string, files: IFilesStorage) {
		const { filesRegistry } = this.storage;

		// Upload new files
		if (!(url in this.uploadedFiles)) {
			this.uploadedFiles[url] = Promise.resolve().then(async () => {
				const buffer = await files.get(url);
				if (!buffer) return null;

				return filesRegistry.add(
					new File([buffer], getPathSegments(url).basename),
				);
			});
		}

		return this.uploadedFiles[url];
	}
}
