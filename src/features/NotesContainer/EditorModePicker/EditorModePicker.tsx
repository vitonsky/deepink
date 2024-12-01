import React, { useEffect, useState } from 'react';
import { FaFeather } from 'react-icons/fa6';
import { Box, Text } from '@chakra-ui/react';
import { NestedList } from '@components/NestedList';
import { Popper } from '@components/Popper';
import { useAppDispatch, useAppSelector } from '@state/redux/hooks';
import {
	GlobalSettings,
	selectEditorMode,
	settingsApi,
} from '@state/redux/settings/settings';

import { useStatusBarManager } from '../../MainScreen/StatusBar/StatusBarProvider';

export const useStatusBarButton = () => {};

export const EditorModePicker = () => {
	const { controls } = useStatusBarManager();

	const dispatch = useAppDispatch();
	const editorMode = useAppSelector(selectEditorMode);

	const [isVisible, setIsVisible] = useState(false);
	const [referenceRef, setReferenceRef] = useState<HTMLElement | null>(null);

	useEffect(() => {
		controls.update(
			'editor-mode',
			{
				visible: true,
				text: `Editor mode: ${editorMode}`,
				icon: (
					<Box ref={setReferenceRef}>
						<FaFeather />
					</Box>
				),
				onClick: () => setIsVisible((state) => !state),
			},
			{
				placement: 'end',
				priority: 100000,
			},
		);
	}, [controls, editorMode]);

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
		>
			<NestedList
				items={[
					{
						id: 'plaintext',
						content: <Text p=".5rem">Text editor</Text>,
					},
					{
						id: 'richtext',
						content: <Text p=".5rem">Rich-text editor</Text>,
					},
					{
						id: 'split-screen',
						content: <Text p=".5rem">Split editor</Text>,
					},
				]}
				onPick={(id) => {
					dispatch(
						settingsApi.setEditorMode(id as GlobalSettings['editorMode']),
					);
					onClose();
				}}
			/>
		</Popper>
	);
};
