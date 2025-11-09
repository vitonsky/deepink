import React, { useEffect, useState } from 'react';
import { FaFeather } from 'react-icons/fa6';
import { Divider, Text, VStack } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { Popper } from '@components/Popper';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { telemetry } from '@electron/requests/telemetry/renderer';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import { useWorkspaceSelector } from '@state/redux/profiles/hooks';
import { selectOpenedNotes } from '@state/redux/profiles/profiles';
import {
	EditorMode,
	selectEditorMode,
	settingsApi,
} from '@state/redux/settings/settings';

import { useStatusBarManager } from '../../MainScreen/StatusBar/StatusBarProvider';

export const editorModes = {
	plaintext: 'Plain text',
	richtext: 'Rich text',
	'split-screen': 'Split screen',
} satisfies Record<EditorMode, string>;

export const EditorModePicker = () => {
	const { controls } = useStatusBarManager();

	const dispatch = useAppDispatch();
	const editorMode = useAppSelector(selectEditorMode);

	const [isVisible, setIsVisible] = useState(false);
	const [referenceRef, setReferenceRef] = useState<HTMLElement | null>(null);

	const openedNotes = useWorkspaceSelector(selectOpenedNotes);
	const isNotesOpened = openedNotes.length > 0;

	useEffect(() => {
		// Update state by close notes
		setIsVisible((state) => (isNotesOpened ? state : false));

		controls.update(
			'editor-mode',
			{
				visible: isNotesOpened,
				title: 'Editor mode',
				text: editorModes[editorMode],
				icon: <FaFeather />,
				onClick: () => setIsVisible((state) => !state),
				ref: setReferenceRef,
			},
			{
				placement: 'end',
				priority: 100000,
			},
		);
	}, [controls, editorMode, isNotesOpened]);

	useEffect(() => {
		return () => {
			controls.unregister('notifications');
		};
	}, [controls]);

	const onClose = () => setIsVisible(false);

	if (!isVisible) return null;

	return (
		<Popper
			referenceRef={referenceRef ?? undefined}
			onClose={onClose}
			backgroundColor="surface.background"
			border="1px solid"
			borderColor="surface.border"
			minW="150px"
		>
			<VStack gap={0} align="start">
				<Text padding=".5rem" fontWeight="bold">
					Editor mode
				</Text>
				<Divider />
				<NestedList
					items={(
						['plaintext', 'richtext', 'split-screen'] as EditorMode[]
					).map((id) => ({
						id,
						content: <Text p=".5rem">{editorModes[id]}</Text>,
					}))}
					onPick={(id) => {
						dispatch(settingsApi.setEditorMode(id as EditorMode));
						onClose();

						telemetry.track(TELEMETRY_EVENT_NAME.EDITOR_MODE_CHANGED, {
							editorMode: id,
						});
					}}
				/>
			</VStack>
		</Popper>
	);
};
