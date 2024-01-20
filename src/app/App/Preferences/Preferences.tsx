import React, { useCallback, useEffect, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';
import { Select } from 'react-elegant-ui/esm/components/Select/Select.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { FaWrench, FaXmark } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';

import { Features } from '../../components/Features/Features';
import { FeaturesHeader } from '../../components/Features/Header/FeaturesHeader';
import { FeaturesOption } from '../../components/Features/Option/FeaturesOption';
import { Icon } from '../../components/Icon/Icon.bundle/common';
import { Modal } from '../../components/Modal/Modal.bundle/Modal.desktop';
import { Stack } from '../../components/Stack/Stack';

import { useBottomPanelManager } from '../MainScreen/StatusBar';

import './Preferences.css';

export const cnPreferences = cn('Preferences');

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

	const onClose = useCallback(() => setIsOpened(false), []);

	return (
		<Modal visible={isOpened} onClose={onClose} renderToStack view="screen">
			<div className={cnPreferences()}>
				<div className={cnPreferences('Head')}>
					<div className={cnPreferences('HeadStart')}></div>
					<div className={cnPreferences('HeadEnd')}>
						<Button
							view="clear"
							className={cnPreferences('CloseButton')}
							onPress={onClose}
						>
							<Icon hasGlyph scalable boxSize="1rem">
								<FaXmark />
							</Icon>
						</Button>
					</div>
				</div>

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

						<FeaturesOption title="Encryption algorithm">
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

						<FeaturesHeader view="section">Data</FeaturesHeader>

						<FeaturesOption
							title="Notes management"
							description="You may export and import notes as markdown files with attachments. Try it if you migrate from another note taking app"
						>
							<Stack direction="horizontal" spacing={2}>
								<Button>Import notes</Button>
								<Button>Export notes</Button>
							</Stack>
						</FeaturesOption>

						<FeaturesOption title="History">
							<Stack direction="vertical" spacing={2}>
								<Checkbox label="Enable history for notes" />
								<Checkbox label="Use recycle bin" />
							</Stack>
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

				<div className={cnPreferences('Footer')}>
					<div className={cnPreferences('HeadStart')}></div>
					<div className={cnPreferences('HeadEnd')}>
						<Stack direction="horizontal">
							<Button view="default" size="s">
								Cancel
							</Button>
							<Button view="action" size="s">
								Apply
							</Button>
						</Stack>
					</div>
				</div>
			</div>
		</Modal>
	);
};
