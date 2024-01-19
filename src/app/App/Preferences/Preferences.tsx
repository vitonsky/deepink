import React, { useEffect, useState } from 'react';
import { FaWrench } from 'react-icons/fa6';

import { Modal } from '../../components/Modal/Modal.bundle/Modal.desktop';
import { Stack } from '../../components/Stack/Stack';

import { useBottomPanelManager } from '../MainScreen/StatusBar';

export const Preferences = () => {
	const [isOpened, setIsOpened] = useState(false);

	const { manager } = useBottomPanelManager();
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
			<Stack direction="vertical">Settings</Stack>
		</Modal>
	);
};
