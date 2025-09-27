import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { stringify as stringifyYaml } from 'yaml';
import { IFilesStorage } from '@core/features/files';
import { FilesController } from '@core/features/files/FilesController';
import { getAppResourceDataInUrl } from '@core/features/links';
import { INote } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { getPathSegments, getRelativePath, joinPathSegments } from '@utils/fs/paths';

import { replaceUrls } from '../utils/mdast';

type ExportContext = {
	files: IFilesStorage;
	/**
	 * Saves an attachment by id and returns absolute path to a file
	 */
	saveAttachment: (id: string) => Promise<string | null>;
};

export class NotesExporter {
	constructor(
		private readonly context: {
			notesRegistry: INotesController;
			filesRegistry: FilesController;
			tagsRegistry: TagsController;
		},
	) {}

	private async exportSingleNote(note: INote, { saveAttachment }: ExportContext) {
		const { tagsRegistry } = this.context;

		const notePath = getPathSegments(this.resolveNotePath(note.id));

		const markdownProcessor = unified()
			.use(remarkParse)
			.use(remarkParseFrontmatter)
			.use(remarkFrontmatter, ['yaml', 'toml'])
			.use(remarkGfm)
			.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
			.freeze();

		const tags = await tagsRegistry
			.getAttachedTags(note.id)
			.then((tags) =>
				tags.map((tag) => tag.resolvedName).sort((a, b) => (b > a ? -1 : 1)),
			);

		const mdTree = markdownProcessor.parse(note.content.text);

		// TODO: insert frontmater optionally
		mdTree.children.unshift({
			type: 'yaml',
			value: stringifyYaml({
				title: note.content.title,
				created: note.createdTimestamp,
				updated: note.updatedTimestamp,
				tags,
			}),
		});

		await replaceUrls(
			mdTree,
			async (nodeUrl) => {
				const appResource = getAppResourceDataInUrl(nodeUrl);

				if (!appResource) return nodeUrl;

				// Format note link
				if (appResource.type === 'note')
					return getRelativePath(
						this.resolveNotePath(appResource.id),
						notePath.dirname,
					);

				// Save attachment and format link
				const filePath = await saveAttachment(appResource.id);
				return filePath ? getRelativePath(filePath, notePath.dirname) : nodeUrl;
			},
			true,
		);

		return markdownProcessor.stringify(mdTree);
	}

	// TODO: implement import for single note
	// public async exportNote(noteId: string) {
	// 	return this.exportSingleNote(noteId, this.createFileUploader());
	// }

	public async exportNotes(files: IFilesStorage) {
		const { notesRegistry, filesRegistry } = this.context;
		const notes = await notesRegistry.get();

		const fetchedFiles: Record<string, Promise<string | null>> = {};

		await Promise.all(
			notes.map(async (note) => {
				const data = await this.exportSingleNote(note, {
					files,
					saveAttachment: async (id: string) => {
						// Fetch file and upload
						if (!(id in fetchedFiles)) {
							fetchedFiles[id] = Promise.resolve().then(async () => {
								const file = await filesRegistry.get(id);
								if (!file) return null;

								const fileName = `${id}-${file.name}`;
								const path = joinPathSegments(['_resources', fileName]);

								const buffer = await file.arrayBuffer();

								await files.write(path, buffer);
								return path;
							});
						}

						return fetchedFiles[id];
					},
				});

				await files.write(
					this.resolveNotePath(note.id),
					new TextEncoder().encode(data),
				);
			}),
		);
	}

	private resolveNotePath(id: string) {
		return joinPathSegments([`${id}.md`]);
	}
}
