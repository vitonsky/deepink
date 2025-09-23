import React, { createContext, FC, PropsWithChildren, useState } from 'react';
import { createEvent } from 'effector';
import { EventBus } from '@api/events/EventBus';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { INote } from '@core/features/notes';
import { INotesController } from '@core/features/notes/controller';
import { NoteVersions } from '@core/features/notes/history/NoteVersions';
import { TagsController } from '@core/features/tags/controller/TagsController';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type NotesApi = {
	openNote: (note: INote, focus?: boolean) => void;
	noteUpdated: (note: INote) => void;
	noteClosed: (noteId: string) => void;
};
export const NotesContext = createContext<NotesApi | null>(null);
export const useNotesContext = createContextGetterHook(NotesContext);

export const EventBusContext = createContext<EventBus | null>(null);
export const useEventBus = createContextGetterHook(EventBusContext);

export const NotesRegistryContext = createContext<INotesController | null>(null);
export const useNotesRegistry = createContextGetterHook(NotesRegistryContext);

export const NotesHistoryContext = createContext<NoteVersions | null>(null);
export const useNotesHistory = createContextGetterHook(NotesHistoryContext);

export const TagsRegistryContext = createContext<TagsController | null>(null);
export const useTagsRegistry = createContextGetterHook(TagsRegistryContext);

export const AttachmentsControllerContext = createContext<AttachmentsController | null>(
	null,
);
export const useAttachmentsController = createContextGetterHook(
	AttachmentsControllerContext,
);

export const FilesRegistryContext = createContext<FilesController | null>(null);
export const useFilesRegistry = createContextGetterHook(FilesRegistryContext);

export interface WorkspaceProviderProps extends PropsWithChildren {
	notesApi: NotesApi;

	filesRegistry: FilesController;
	attachmentsController: AttachmentsController;
	tagsRegistry: TagsController;
	notesRegistry: INotesController;
	notesHistory: NoteVersions;
}

export const WorkspaceProvider: FC<WorkspaceProviderProps> = ({
	notesApi,
	filesRegistry,
	attachmentsController,
	tagsRegistry,
	notesRegistry,
	notesHistory,
	children,
}) => {
	const [eventBus] = useState(() => {
		const event = createEvent<{
			name: string;
			payload: any;
		}>();
		return {
			emit(eventName: string, payload?: any) {
				event({ name: eventName, payload });
			},
			listen(eventName, callback) {
				return event.watch((event) => {
					if (event.name !== eventName) return;

					callback(event.payload);
				});
			},
		} satisfies EventBus;
	});

	return (
		<EventBusContext.Provider value={eventBus}>
			<NotesContext.Provider value={notesApi}>
				<FilesRegistryContext.Provider value={filesRegistry}>
					<AttachmentsControllerContext.Provider value={attachmentsController}>
						<TagsRegistryContext.Provider value={tagsRegistry}>
							<NotesRegistryContext.Provider value={notesRegistry}>
								<NotesHistoryContext.Provider value={notesHistory}>
									{children}
								</NotesHistoryContext.Provider>
							</NotesRegistryContext.Provider>
						</TagsRegistryContext.Provider>
					</AttachmentsControllerContext.Provider>
				</FilesRegistryContext.Provider>
			</NotesContext.Provider>
		</EventBusContext.Provider>
	);
};
