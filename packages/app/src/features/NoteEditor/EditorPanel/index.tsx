import React, { createContext, PropsWithChildren, useState } from 'react';
import { createEvent, EventCallable } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type TextFormat = 'bold' | 'italic' | 'strikethrough';

export type HeaderLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type InsertingPayloadMap = {
	heading: {
		level: HeaderLevel;
	};
	list: {
		type: 'checkbox' | 'ordered' | 'unordered';
	};
	link: {
		url: string;
	};
	image: {
		url: string;
		altText: string;
	};
	code: void;
	quote: void;
	horizontalRule: void;
	date: {
		date: string;
	};
	file: {
		files: FileList;
	};
};
export type InsertingPayload = {
	[K in keyof InsertingPayloadMap]: {
		type: K;
	} & (void extends InsertingPayloadMap[K] ? {} : { data: InsertingPayloadMap[K] });
}[keyof InsertingPayloadMap];

export const editorPanelContext = createContext<{
	onFormatting: EventCallable<TextFormat>;
	onInserting: EventCallable<InsertingPayload>;
}>(null as any);

export const useEditorPanelContext = createContextGetterHook(editorPanelContext);
export const EditorPanelContext = ({ children }: PropsWithChildren) => {
	const [events] = useState(() => ({
		onFormatting: createEvent<TextFormat>(),
		onInserting: createEvent<InsertingPayload>(),
	}));

	return (
		<editorPanelContext.Provider value={events}>
			{children}
		</editorPanelContext.Provider>
	);
};
