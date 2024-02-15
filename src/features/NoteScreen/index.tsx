import React, {
	FC,
	ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { Spinner } from 'react-elegant-ui/esm/components/Spinner/Spinner.bundle/desktop';
import ReactMarkdown from 'react-markdown';
import { debounce } from 'lodash';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { cn } from '@bem-react/classname';

import { getResourceIdInUrl } from '../../core/features/links';
import { INote } from '../../core/features/notes';

import { useAttachmentsRegistry, useFilesRegistry } from '../Providers';
import {
	Checkbox,
	InputComponent,
	ListItem,
	RequestCheckboxUpdate,
} from './components/Checkbox';
import { Link } from './components/Link';

import 'github-markdown-css/github-markdown.css';
import './NoteScreen.css';

const cnNoteScreen = cn('NoteScreen');

export type NoteScreenProps = {
	note: INote;
	update: (text: string) => void;
};

type BlobResource = { url: string; dispose: () => void };

const useFilesUrls = () => {
	const resourcesRef = useRef<Record<string, BlobResource | null>>({});
	const pendingResourcesRef = useRef<Record<string, Promise<BlobResource | null>>>({});

	// TODO: free urls that not used anymore
	// Object URLs are not clear itself, so we must free it after use
	useEffect(() => {
		return () => {
			const cleanup = () => {
				// eslint-disable-next-line react-hooks/exhaustive-deps
				Object.values(resourcesRef.current).forEach((resource) => {
					if (resource) {
						resource.dispose();
					}
				});
			};

			// Cleanup active resources
			cleanup();

			// Cleanup after loading
			// eslint-disable-next-line react-hooks/exhaustive-deps
			Object.values(pendingResourcesRef.current).forEach((promise) =>
				promise.then(cleanup),
			);
		};
	}, []);

	const filesRegistry = useFilesRegistry();
	const getBlobResource = useCallback(
		async (id: string) => {
			// Skip for loaded resources and resources in loading state
			const resource = resourcesRef.current[id] || pendingResourcesRef.current[id];
			if (resource) return resource;

			// Start loading
			const resourcePromise = filesRegistry
				.get(id)
				.then(async (file) => {
					// await new Promise((res) => setTimeout(res, 1200));

					// TODO: maybe we should to skip too long files, to not keep it in memory?
					if (!file) {
						resourcesRef.current[id] = null;
					} else {
						const url = URL.createObjectURL(file);
						resourcesRef.current[id] = {
							url,
							dispose: () => URL.revokeObjectURL(url),
						};
					}

					return resourcesRef.current[id];
				})
				.finally(() => {
					delete pendingResourcesRef.current[id];
				});

			pendingResourcesRef.current[id] = resourcePromise;

			return resourcePromise;
		},
		[filesRegistry],
	);

	return useCallback(
		(filesId: string[]) => {
			return Promise.all(filesId.map((file) => getBlobResource(file)));
		},
		[getBlobResource],
	);
};

export const NoteScreen: FC<NoteScreenProps> = ({ note, update }) => {
	const [text, setText] = useState('');

	const attachmentsRegistry = useAttachmentsRegistry();

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const debouncedSetText = useCallback(
		debounce((text: string) => {
			setText(text);
		}, 300),
		[],
	);

	// Update text with delay, to not render too frequently
	const isImmediateRenderRef = useRef(false);
	const currentText = note.content.text;
	useEffect(() => {
		debouncedSetText(currentText);

		if (isImmediateRenderRef.current) {
			isImmediateRenderRef.current = false;
			debouncedSetText.flush();
		}
	}, [currentText, debouncedSetText]);

	const Input = useMemo(() => {
		const updateCheckbox: RequestCheckboxUpdate = (isChecked, sourcePosition) => {
			const start = sourcePosition.start.offset;
			const end = sourcePosition.end.offset;

			if (start === undefined || end === undefined) return;

			const nodeValue = text.slice(start, end);
			const updatedValue = nodeValue.replace(
				/\[(x|\s)\]/,
				`[${isChecked ? 'x' : ' '}]`,
			);
			if (updatedValue === nodeValue) return;

			const updatedText = text.slice(0, start) + updatedValue + text.slice(end);

			isImmediateRenderRef.current = true;
			update(updatedText);
		};

		const WrappedComponent: InputComponent = (props) => {
			return <Checkbox updateCheckbox={updateCheckbox} {...props} />;
		};

		return WrappedComponent;
	}, [text, update]);

	const [markdownContent, setMarkdownContent] = useState<ReactNode>(null);
	const getFilesUrl = useFilesUrls();

	const renderContextSymbolRef = useRef({});
	useEffect(() => {
		const renderSymbol = {};
		renderContextSymbolRef.current = renderSymbol;

		(async () => {
			const attachedFilesUrls = await attachmentsRegistry.get(note.id);
			const filesUrl = await getFilesUrl(attachedFilesUrls);
			const filesMap = attachedFilesUrls.reduce((files, id, index) => {
				files[id] = filesUrl[index];
				return files;
			}, {} as Record<string, BlobResource | null>);

			// Skip render, if text been updated while awaiting
			if (renderSymbol !== renderContextSymbolRef.current) return;

			setMarkdownContent(
				<ReactMarkdown
					// FIXME: errors occurs with some texts
					remarkPlugins={[remarkGfm, remarkBreaks]}
					transformImageUri={(sourceUrl) => {
						if (!sourceUrl) return sourceUrl;

						const resourceId = getResourceIdInUrl(sourceUrl);
						if (!resourceId) return sourceUrl;

						const file = filesMap[resourceId];
						return file ? file.url : sourceUrl;
					}}
					transformLinkUri={(uri) => uri}
					sourcePos={true}
					rawSourcePos={true}
					components={{
						a: Link,
						li: ListItem,
						input: Input,
					}}
				>
					{text}
				</ReactMarkdown>,
			);
		})();
	}, [Input, attachmentsRegistry, getFilesUrl, note.id, text, update]);

	return (
		<div className={cnNoteScreen()}>
			{markdownContent ? (
				<div className={cnNoteScreen('Content', ['markdown-body'])}>
					{markdownContent}
				</div>
			) : (
				<div className={cnNoteScreen('SplashScreen')}>
					<Spinner
						className={cnNoteScreen('Spinner')}
						view="primitive"
						size="l"
						progress
					/>
				</div>
			)}
		</div>
	);
};
