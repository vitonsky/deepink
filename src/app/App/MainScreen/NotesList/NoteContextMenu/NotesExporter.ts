import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { stringify as stringifyYaml } from 'yaml';

import { getAppResourceDataInUrl } from '../../../../../core/links';
import { FilesController } from '../../../../../core/storage/controllers/files/FilesController';
import { INotesController } from '../../../../../core/storage/controllers/notes';
import { TagsController } from '../../../../../core/storage/controllers/tags/TagsController';
import { replaceUrls } from '../../StatusBar/buttons/useImportNotes';

export type SaveFileCallback = (file: File, id: string) => Promise<string>;
export type FileUploader = (id: string) => Promise<string | null>;

export class NotesExporter {
	private readonly saveFile;
	private readonly notesRegistry;
	private readonly filesRegistry;
	private readonly tagsRegistry;

	constructor({
		saveFile,
		notesRegistry,
		filesRegistry,
		tagsRegistry,
	}: {
		saveFile: SaveFileCallback;
		notesRegistry: INotesController;
		filesRegistry: FilesController;
		tagsRegistry: TagsController;
	}) {
		this.saveFile = saveFile;
		this.notesRegistry = notesRegistry;
		this.filesRegistry = filesRegistry;
		this.tagsRegistry = tagsRegistry;
	}

	private createFileUploader() {
		const fetchedFiles: Record<string, string | null> = {};
		return async (id: string) => {
			// Fetch file and upload
			if (!(id in fetchedFiles)) {
				const file = await this.filesRegistry.get(id);
				fetchedFiles[id] = file ? await this.saveFile(file, id) : null;
			}

			return fetchedFiles[id];
		};
	}

	private async exportSingleNote(noteId: string, getUploadedFilePath: FileUploader) {
		const note = await this.notesRegistry.getById(noteId);
		if (!note) return;

		const markdownProcessor = unified()
			.use(remarkParse)
			.use(remarkParseFrontmatter)
			.use(remarkFrontmatter, ['yaml', 'toml'])
			.use(remarkGfm)
			.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
			.freeze();

		const mdTree = markdownProcessor.parse(note.data.text);

		const tags = await this.tagsRegistry
			.getAttachedTags(note.id)
			.then((tags) => tags.map((tag) => tag.resolvedName));
		mdTree.children.unshift({
			type: 'yaml',
			value: stringifyYaml({
				title: note.data.title,
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
				if (appResource.type === 'note') return `./${appResource.id}.md`;

				const filePath = await getUploadedFilePath(appResource.id);
				return filePath ?? nodeUrl;
			},
			true,
		);

		return markdownProcessor.stringify(mdTree);
	}

	public async exportNote(noteId: string) {
		return this.exportSingleNote(noteId, this.createFileUploader());
	}

	public async exportNotes() {
		const notes = await this.notesRegistry.get();
		const uploader = this.createFileUploader();

		return Promise.all(
			notes.map(async (note) => {
				const data = await this.exportSingleNote(note.id, uploader);
				return { id: note.id, data };
			}),
		).then((notes) => notes.filter((note) => note.data !== undefined)) as Promise<
			Array<{ id: string; data: string }>
		>;
	}
}
