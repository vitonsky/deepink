import React, { createContext, PropsWithChildren, useState } from 'react';
import { createEvent, EventCallable } from 'effector';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type FormattingPayload = 'bold' | 'italic' | 'strikethrough';

export type InsertingPayloadMap = {
	heading: {
		level: 1 | 2 | 3 | 4 | 5 | 6;
	};
	list: {
		type: 'checkbox' | 'ordered' | 'unordered';
	};
	link: {
		url: string;
		text: string;
	};
	image: {
		url: string;
		altText: string;
	};
	code: {
		text?: string;
	};
	quote: {
		text?: string;
	};
	horizontalRule: void;
	date: {
		date: string;
	};
	file: {
		type: File;
	};
};
export type InsertingPayload = {
	[K in keyof InsertingPayloadMap]: {
		type: K;
	} & (void extends InsertingPayloadMap[K] ? {} : { data: InsertingPayloadMap[K] });
}[keyof InsertingPayloadMap];

export const editorPanelContext = createContext<{
	onFormatting: EventCallable<FormattingPayload>;
	onInserting: EventCallable<InsertingPayload>;
}>(null as any);

export const useEditorPanelContext = createContextGetterHook(editorPanelContext);
export const EditorPanelContext = ({ children }: PropsWithChildren) => {
	const [events] = useState(() => ({
		onFormatting: createEvent<FormattingPayload>(),
		onInserting: createEvent<InsertingPayload>(),
	}));

	return (
		<editorPanelContext.Provider value={events}>
			{children}
		</editorPanelContext.Provider>
	);
};
