import React, { FC, HTMLProps, useCallback } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { fromMarkdown } from 'mdast-util-from-markdown';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';
import { cn } from '@bem-react/classname';

import { formatResourceLink } from '../../../../../core/links';
import { INotesRegistry } from '../../../../../core/Registry';
import { exportNotes } from '../../../../../electron/requests/files/renderer';
import { useFilesRegistry } from '../../../Providers';

import './StatusBar.css';

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
export const StatusBar: FC<StatusBarProps> = ({ className, notesRegistry, updateNotes, ...props }) => {
	const filesRegistry = useFilesRegistry();
	const onImportNotes = useCallback(async () => {
		const files = await exportNotes();

		console.warn('Files', files);

		const uploadedFilesMap: Record<string, string> = {};

		// TODO: attach tags with full hierarchy
		// TODO: upload files and replace references
		const enc = new TextDecoder("utf-8");
		for (const filename in files) {
			// Skip not markdown files
			const fileExtension = '.md';
			if (!filename.endsWith(fileExtension)) continue;

			const fileBuffer = files[filename];
			const noteText = enc.decode(fileBuffer);
			// console.warn({ noteText });

			const tree = fromMarkdown(noteText);

			const urls: string[] = [];
			visit(tree, ['link', 'image'], function (node) {
				if (node.type !== 'link' && node.type !== 'image') return;

				// Skip not local urls
				const urlRegEx = /^[a-z]+:\/\//;
				if (urlRegEx.test(node.url)) return;

				urls.push(getRelativePath(filename, node.url));
			});

			// Upload files
			await Promise.all(urls.map(async (url) => {
				const urlRealPath = decodeURI(url);

				// Skip uploaded files
				if (uploadedFilesMap[urlRealPath]) return;

				const buffer = files[urlRealPath];
				if (!buffer) return;

				const urlFilename = urlRealPath.split('/').slice(-1)[0];
				const file = new File([buffer], urlFilename);

				const fileId = await filesRegistry.add(file);
				uploadedFilesMap[urlRealPath] = fileId;
			}));

			visit(tree, ['link', 'image'], function (node) {
				if (node.type !== 'link' && node.type !== 'image') return;

				// Skip not local urls
				const urlRegEx = /^[a-z]+:\/\//;
				if (urlRegEx.test(node.url)) return;

				const url = decodeURI(getRelativePath(filename, node.url));
				const fileId = uploadedFilesMap[url];
				if (!fileId) return;

				node.url = formatResourceLink(fileId);
			});

			// TODO: do not change original note markup
			const result = unified().use(remarkStringify).stringify(tree as any);
			const noteNameWithExt = filename.split('/').slice(-1)[0];
			const noteName = noteNameWithExt.slice(0, noteNameWithExt.length - fileExtension.length);
			await notesRegistry.add({
				// TODO: try get name from note head meta data
				title: noteName,
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
