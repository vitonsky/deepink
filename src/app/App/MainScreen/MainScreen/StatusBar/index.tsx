import React, { FC, HTMLProps, useCallback } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { Root } from 'remark-parse/lib';
import remarkParseFrontmatter from 'remark-parse-frontmatter';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { remove } from 'unist-util-remove';
import { visit } from 'unist-util-visit';
import { cn } from '@bem-react/classname';

import { formatResourceLink } from '../../../../../core/links';
import { INotesRegistry } from '../../../../../core/Registry';
import { exportNotes } from '../../../../../electron/requests/files/renderer';
import { useFilesRegistry } from '../../../Providers';

import './StatusBar.css';

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

export const cnStatusBar = cn('StatusBar');

export type StatusBarProps = HTMLProps<HTMLDivElement> & {
	notesRegistry: INotesRegistry;
	updateNotes: () => void;
};

const getRelativePath = (currentPath: string, relativePath: string) => {
	const url = new URL(relativePath, `https://root/${currentPath}`);
	return url.pathname.slice(1);
};

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = ({
	className,
	notesRegistry,
	updateNotes,
	...props
}) => {
	const filesRegistry = useFilesRegistry();
	const onImportNotes = useCallback(async () => {
		const files = await exportNotes();

		console.warn('Files', files);

		// TODO: attach tags with full hierarchy
		// TODO: upload files and replace references
		const enc = new TextDecoder('utf-8');
		for (const filename in files) {
			// Skip not markdown files
			const fileExtension = '.md';
			if (!filename.endsWith(fileExtension)) continue;

			const fileBuffer = files[filename];
			const noteText = enc.decode(fileBuffer);
			// console.warn({ noteText });

			const processor = unified()
				.use(remarkParse)
				.use(remarkParseFrontmatter)
				.use(remarkFrontmatter, ['yaml', 'toml'])
				.use(remarkGfm)
				.use(remarkStringify, { bullet: '-', listItemIndent: 'one' })
				.freeze();

			const tree = processor.parse(noteText);

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

			await replaceUrls(tree, async (nodeUrl) => {
				const url = getRelativePath(filename, nodeUrl);
				const fileId = await getUploadedFileId(url);
				return fileId ? formatResourceLink(fileId) : nodeUrl;
			});

			const file = processor.processSync(noteText);
			const noteData = file.data.frontmatter as any;

			remove(tree, 'yaml');
			const result = processor.stringify(tree);
			console.warn({ tree, file, noteData, result });

			// TODO: do not change original note markup
			const noteNameWithExt = filename.split('/').slice(-1)[0];
			const noteName = noteNameWithExt.slice(0, noteNameWithExt.length - fileExtension.length);
			await notesRegistry.add({
				title: noteData.title || noteName,
				text: result,
			});

			// TODO: add method to registry, to emit event by updates
			updateNotes();
		}

		updateNotes();
	}, [filesRegistry, notesRegistry, updateNotes]);

	return (
		<div {...props} className={cnStatusBar({}, [className])}>
			<Button size="s" view="action" onPress={onImportNotes}>
				Import
			</Button>
		</div>
	);
};
