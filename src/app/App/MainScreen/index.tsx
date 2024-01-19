import React, {
	createContext,
	FC,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Select } from 'react-elegant-ui/esm/components/Select/Select.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { cnTheme } from 'react-elegant-ui/esm/theme';
import { theme } from 'react-elegant-ui/esm/theme/presets/default';
import {
	FaArrowDownWideShort,
	FaArrowsRotate,
	FaBell,
	FaClockRotateLeft,
	FaCompress,
	FaGear,
	FaLock,
	FaMagnifyingGlass,
	FaPenToSquare,
	FaUserLarge,
	FaWrench,
} from 'react-icons/fa6';
import { useStore, useStoreMap } from 'effector-react';
import { cn } from '@bem-react/classname';

import { INote, NoteId } from '../../../core/Note';
import {
	$activeNoteId,
	$openedNotes,
	activeNoteChanged,
	openedNotesControls,
} from '../../../core/state/notes';
import { changedActiveProfile } from '../../../core/state/profiles';
import { $activeTag, $tags, tagAttachmentsChanged } from '../../../core/state/tags';
import { Icon } from '../../components/Icon/Icon.bundle/common';
import { Modal } from '../../components/Modal/Modal.bundle/Modal.desktop';
import { Stack } from '../../components/Stack/Stack';

import { useNotesRegistry, useTagsRegistry } from '../Providers';
import { Notes } from './Notes';
import { NotesList } from './NotesList';
import { NotesOverview } from './NotesOverview';
import { StatusBar, StatusBarButton, StatusBarContext } from './StatusBar';
import { TopBar } from './TopBar';

import './MainScreen.css';

export const cnMainScreen = cn('MainScreen');

type ManagedButton = {
	id: string;
	button: StatusBarButton;
};

type ManagedButtons = { start: ManagedButton[]; end: ManagedButton[] };

type Placement = 'start' | 'end';

class StatusBarButtonsManager {
	private updateCallback: (state: ManagedButtons) => void;
	constructor(updateCallback: (state: ManagedButtons) => void) {
		this.updateCallback = updateCallback;
	}

	private readonly buttons: { start: ManagedButton[]; end: ManagedButton[] } = {
		start: [],
		end: [],
	};

	private deleteIfExists(id: string) {
		for (const sideName in this.buttons) {
			this.buttons[sideName as Placement] = this.buttons[
				sideName as Placement
			].filter((button) => button.id !== id);
		}
	}

	private updateState() {
		this.updateCallback(this.buttons);
	}

	public get() {
		return this.buttons;
	}

	public register(id: string, button: StatusBarButton, placement: 'start' | 'end') {
		this.deleteIfExists(id);
		this.buttons[placement].push({
			id,
			button,
		});

		this.updateState();
	}

	public unregister(id: string) {
		this.deleteIfExists(id);
		this.updateState();
	}

	public update(id: string, button: StatusBarButton) {
		// Find button
		let existsButton: [Placement, number] | null = null;
		for (const sideName in this.buttons) {
			const buttonIndex = this.buttons[sideName as Placement].findIndex(
				(button) => button.id === id,
			);
			if (buttonIndex !== -1) {
				existsButton = [sideName as Placement, buttonIndex];
				break;
			}
		}

		if (existsButton === null) return;

		const [placement, index] = existsButton;
		this.buttons[placement][index] = {
			id,
			button,
		};

		this.updateState();
	}
}

type ButtonsManager123 = {
	readonly state: {
		left: StatusBarButton[];
		right: StatusBarButton[];
	};
	readonly manager: StatusBarButtonsManager;
};

const useButtonsManager = (): ButtonsManager123 => {
	const [state, setState] = useState<{
		left: StatusBarButton[];
		right: StatusBarButton[];
	}>({ left: [], right: [] });

	const managerRef = useRef<StatusBarButtonsManager>(
		null as unknown as StatusBarButtonsManager,
	);
	if (!managerRef.current) {
		managerRef.current = new StatusBarButtonsManager((buttons) => {
			console.log('Update 1', buttons);
			setState({
				left: buttons.start.map((button) => button.button),
				right: buttons.end.map((button) => button.button),
			});
		});
	}

	return { state, manager: managerRef.current } as const;
};

export const BottomPanelButtonsManagerContext = createContext<ButtonsManager123>(
	null as unknown as ButtonsManager123,
);
export const useBottomPanelButtonsManager = () => {
	return useContext(BottomPanelButtonsManagerContext);
};

// TODO: move component to another file
export const Preferences = () => {
	const [isOpened, setIsOpened] = useState(false);

	const { manager } = useBottomPanelButtonsManager();
	useEffect(() => {
		manager.register(
			'preferences',
			{
				visible: true,
				title: 'Preferences',
				icon: <FaWrench />,
				onClick: () => setIsOpened(true),
			},
			'start',
		);

		return () => {
			manager.unregister('preferences');
		};
	}, [manager]);

	return (
		<Modal
			visible={isOpened}
			onClose={() => setIsOpened(false)}
			renderToStack
			view="screen"
		>
			It's preferences window
		</Modal>
	);
};

export const MainScreen: FC = () => {
	const notesRegistry = useNotesRegistry();
	const activeNoteId = useStore($activeNoteId);
	const [notes, setNotes] = useState<INote[]>([]);

	const activeTag = useStore($activeTag);
	const updateNotes = useCallback(async () => {
		const tags = activeTag === null ? [] : [activeTag];
		const notes = await notesRegistry.get({ limit: 10000, tags });
		notes.sort((a, b) => {
			const timeA = a.updatedTimestamp ?? a.createdTimestamp ?? 0;
			const timeB = b.updatedTimestamp ?? b.createdTimestamp ?? 0;

			if (timeA > timeB) return -1;
			if (timeB > timeA) return 1;
			return 0;
		});
		setNotes(notes);
	}, [activeTag, notesRegistry]);

	const activeTagName = useStoreMap({
		store: $tags,
		fn(state, [activeTag]) {
			if (activeTag === null) return null;
			return state.find((tag) => tag.id === activeTag)?.name ?? null;
		},
		keys: [activeTag],
	});

	useEffect(() => {
		if (activeTag === null) return;

		return tagAttachmentsChanged.watch((ops) => {
			const isHaveUpdates = ops.some(({ tagId }) => activeTag === tagId);
			if (isHaveUpdates) {
				updateNotes();
			}
		});
	}, [activeTag, updateNotes]);

	// Init
	useEffect(() => {
		updateNotes();
	}, [updateNotes]);

	// TODO: focus on note input
	const onNoteClick = useCallback(
		(id: NoteId) => {
			const note = notes.find((note) => note.id === id);
			if (note) {
				openedNotesControls.add(note);
			}

			activeNoteChanged(id);
		},
		[notes],
	);

	const openedNotes = useStore($openedNotes);
	const tabs = useStoreMap($openedNotes, (state) => state.map(({ id }) => id));
	const onNoteClose = useCallback(
		(id: NoteId) => {
			const tabIndex = openedNotes.findIndex((note) => note.id === id);

			// Change tab if it is current tab
			if (id === activeNoteId) {
				let nextTab = null;
				if (tabIndex > 0) {
					nextTab = openedNotes[tabIndex - 1].id;
				} else if (tabIndex === 0 && openedNotes.length > 1) {
					nextTab = openedNotes[1].id;
				}
				activeNoteChanged(nextTab);
			}

			openedNotesControls.delete(id);
		},
		[openedNotes, activeNoteId],
	);

	// Simulate note update
	const updateNote = useCallback(
		async (note: INote) => {
			openedNotesControls.update(note);
			await notesRegistry.update(note.id, note.data);
			updateNotes();
		},
		[notesRegistry, updateNotes],
	);

	const tagsRegistry = useTagsRegistry();
	const newNoteIdRef = useRef<NoteId | null>(null);
	const createNote = useCallback(async () => {
		const noteId = await notesRegistry.add({ title: '', text: '' });

		if (activeTag) {
			await tagsRegistry.setAttachedTags(noteId, [activeTag]);
			tagAttachmentsChanged([
				{
					tagId: activeTag,
					target: noteId,
					state: 'add',
				},
			]);
		}

		newNoteIdRef.current = noteId;
		updateNotes();
	}, [activeTag, notesRegistry, tagsRegistry, updateNotes]);

	// Focus on new note
	useEffect(() => {
		if (newNoteIdRef.current === null) return;

		const newNoteId = newNoteIdRef.current;
		const isNoteExists = notes.find((note) => note.id === newNoteId);
		if (isNoteExists) {
			newNoteIdRef.current = null;
			onNoteClick(newNoteId);
		}
	}, [notes, onNoteClick]);

	const buttonsManager = useButtonsManager();

	useEffect(() => {
		buttonsManager.manager.register(
			'dbChange',
			{
				visible: true,
				title: 'Change database',
				onClick: () => changedActiveProfile(null),
				icon: <FaUserLarge />,
			},
			'start',
		);
		buttonsManager.manager.register(
			'dbLock',
			{
				visible: true,
				title: 'Lock database',
				icon: <FaLock />,
			},
			'start',
		);
		buttonsManager.manager.register(
			'sync',
			{
				visible: true,
				title: 'Sync changes',
				icon: <FaArrowsRotate />,
			},
			'start',
		);

		buttonsManager.manager.register(
			'history',
			{
				visible: true,
				title: 'History',
				icon: <FaClockRotateLeft />,
				text: new Date().toLocaleDateString(),
			},
			'end',
		);
		buttonsManager.manager.register(
			'focusMode',
			{
				visible: true,
				title: 'Focus mode',
				icon: <FaCompress />,
			},
			'end',
		);
		buttonsManager.manager.register(
			'notifications',
			{
				visible: true,
				title: 'Notifications',
				icon: <FaBell />,
			},
			'end',
		);
	}, [buttonsManager.manager]);

	// TODO: add memoizing for tabs mapping
	return (
		<div className={cnMainScreen({}, [cnTheme(theme)])}>
			<div className={cnMainScreen('Content')}>
				<div className={cnMainScreen('SideBar', { view: 'main' })}>
					<Button
						className={cnMainScreen('NewNoteButton')}
						view="action"
						onPress={createNote}
						iconLeft={() => (
							<Icon boxSize="1rem" hasGlyph>
								<FaPenToSquare size="100%" />
							</Icon>
						)}
					>
						New note
					</Button>

					<NotesOverview />

					<div className={cnMainScreen('Workspace')}>
						<Select
							className={cnMainScreen('WorkspacePicker')}
							options={[
								{
									id: 'default',
									content: 'Default',
								},
							]}
							value="default"
						></Select>
						<Button title="Workspace settings">
							<Icon boxSize="1rem" hasGlyph>
								<FaGear size="100%" />
							</Icon>
						</Button>
					</div>
				</div>

				<div className={cnMainScreen('SideBar')}>
					<Stack direction="horizontal" spacing={1}>
						<Textinput
							placeholder="Search..."
							size="s"
							addonBeforeControl={
								<Icon
									boxSize="1rem"
									hasGlyph
									style={{
										zIndex: 2,
										marginInlineStart: '.5rem',
										marginInlineEnd: '.3rem',
										opacity: 0.7,
									}}
								>
									<FaMagnifyingGlass size="100%" />
								</Icon>
							}
						/>

						<Button view="default">
							<Icon boxSize="1rem" hasGlyph>
								<FaArrowDownWideShort size="100%" />
							</Icon>
						</Button>
					</Stack>

					<div className={cnMainScreen('NotesList')}>
						{activeTagName && (
							<div className={cnMainScreen('NotesListSelectedTag')}>
								With tag{' '}
								<span
									className={cnMainScreen('NotesListSelectedTagName')}
								>
									{activeTagName}
								</span>
							</div>
						)}
						<NotesList
							{...{
								notesRegistry,
								notes,
								updateNotes,
								onPick: onNoteClick,
								onClose: onNoteClose,
								openedNotes: tabs,
								activeNote: activeNoteId,
							}}
						/>
					</div>
				</div>
				<Stack
					direction="vertical"
					spacing={2}
					className={cnMainScreen('ContentBlock')}
				>
					<TopBar
						{...{
							notesRegistry,
							updateNotes,
							notes: openedNotes,
							tabs,
							activeTab: activeNoteId ?? null,
							onClose: onNoteClose,
							onPick: onNoteClick,
						}}
					/>
					<div className={cnMainScreen('NoteEditors')}>
						<Notes
							{...{
								notes: openedNotes,
								tabs,
								activeTab: activeNoteId ?? null,
								updateNote,
							}}
						/>
					</div>
				</Stack>
			</div>

			<StatusBarContext.Provider value={buttonsManager.state}>
				<StatusBar notesRegistry={notesRegistry} updateNotes={updateNotes} />
			</StatusBarContext.Provider>

			<BottomPanelButtonsManagerContext.Provider value={buttonsManager}>
				<Preferences />
			</BottomPanelButtonsManagerContext.Provider>
		</div>
	);
};
