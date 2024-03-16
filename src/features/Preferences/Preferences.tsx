import React, { useCallback, useEffect, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';
import { Select } from 'react-elegant-ui/esm/components/Select/Select.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { FaWrench } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';
import { Features } from '@components/Features/Features';
import { FeaturesHeader } from '@components/Features/Header/FeaturesHeader';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

import { ModalScreen } from '../ModalScreen/ModalScreen';

import './Preferences.css';

export const cnPreferences = cn('Preferences');

export const Preferences = () => {
	const [isOpened, setIsOpened] = useState(false);

	const { controls } = useStatusBarManager();
	useEffect(() => {
		controls.register(
			'preferences',
			{
				visible: true,
				title: 'Preferences',
				icon: <FaWrench />,
				onClick: () => setIsOpened(true),
			},
			{
				placement: 'start',
				priority: 5,
			},
		);

		return () => {
			controls.unregister('preferences');
		};
	}, [controls]);

	const onClose = useCallback(() => setIsOpened(false), []);

	return (
		<ModalScreen
			isVisible={isOpened}
			onClose={onClose}
			className={cnPreferences()}
			title="Settings"
		>
			<div className={cnPreferences('Body')}>
				<Features>
					<FeaturesHeader view="primary">Database settings</FeaturesHeader>

					<FeaturesOption title="Database name">
						<Textinput placeholder="Enter database name" />
					</FeaturesOption>

					<FeaturesOption description="Workspaces passwords will be encrypted with master key and saved in database, to automatically open encrypted workspaces with no enter password">
						<Checkbox label="Remember workspaces passwords" checked />
					</FeaturesOption>

					<FeaturesHeader view="section">Encryption</FeaturesHeader>

					<FeaturesOption
						title="Encryption algorithm"
						description="Choose best algorithm you trust"
					>
						<Select
							options={[
								{
									id: 'none',
									content: 'None',
								},
								{
									id: 'aes',
									content: 'AES',
								},
								{
									id: 'twofish',
									content: 'Twofish',
								},
							]}
							value="aes"
						/>
					</FeaturesOption>

					<FeaturesOption title="Password">
						<Button>Update password</Button>
					</FeaturesOption>

					<FeaturesHeader view="section">Synchronization</FeaturesHeader>

					<FeaturesOption description="Sync all data in database between your devices, to not loose it. All data are encrypted.">
						<Checkbox label="Enable synchronization" checked />
					</FeaturesOption>
					<FeaturesOption title="Synchronization method">
						<Select
							options={[
								{
									id: 'fs',
									content: 'File system',
								},
								{
									id: 'server',
									content: 'Server',
								},
							]}
							value="fs"
						/>
					</FeaturesOption>
					<FeaturesOption title="Synchronization directory">
						<Textinput
							placeholder="Enter path on directory"
							value="/foo/bar"
							disabled
						/>
					</FeaturesOption>
				</Features>
			</div>
		</ModalScreen>
	);
};
