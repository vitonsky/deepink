import React, { useEffect, useState } from 'react';
import { FaWrench } from 'react-icons/fa6';

import { useBottomPanelButtonsManager } from '../../api/buttons/useButtonsManager';
import { Modal } from '../../components/Modal/Modal.bundle/Modal.desktop';
import { Stack } from '../../components/Stack/Stack';

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
			<Stack direction="vertical">Settings</Stack>
		</Modal>
	);
};
