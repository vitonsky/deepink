import React, { FC, PropsWithChildren, useCallback, useEffect, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Checkbox } from 'react-elegant-ui/esm/components/Checkbox/Checkbox.bundle/desktop';
import { Select } from 'react-elegant-ui/esm/components/Select/Select.bundle/desktop';
import { Textinput } from 'react-elegant-ui/esm/components/Textinput/Textinput.bundle/desktop';
import { FaRegCircleXmark, FaWrench } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';

import { Icon } from '../../components/Icon/Icon.bundle/common';
import { Modal } from '../../components/Modal/Modal.bundle/Modal.desktop';
import { Stack } from '../../components/Stack/Stack';

import { useBottomPanelManager } from '../MainScreen/StatusBar';

import './Preferences.css';

export const cnPreferences = cn('Preferences');

export type PreferencesOptionPrefs = PropsWithChildren<{
	title?: string;
	description?: string;
}>;

export const PreferencesOption: FC<PreferencesOptionPrefs> = ({
	title,
	description,
	children,
}) => {
	return (
		<Stack direction="vertical" spacing={2} className={cnPreferences('Option')}>
			<div className={cnPreferences('OptionTitle')}>{title}</div>
			<Stack
				direction="vertical"
				spacing={2}
				className={cnPreferences('OptionContent')}
			>
				{children}
				{description && (
					<div className={cnPreferences('OptionDescription')}>
						{description}
					</div>
				)}
			</Stack>
		</Stack>
	);
};

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
			<Stack direction="vertical" className={cnPreferences('Content')} spacing={6}>
				<Button
					view="clear"
					className={cnPreferences('CloseButton')}
					onPress={onClose}
				>
					<Icon hasGlyph scalable boxSize="2rem">
						<FaRegCircleXmark />
					</Icon>
				</Button>

				<h2 className={cnPreferences('Header', { main: true })}>
					Database settings
				</h2>

				<PreferencesOption title="Database name">
					<Textinput placeholder="Enter database name" />
				</PreferencesOption>

				<PreferencesOption description="Workspaces passwords will be encrypted with master key and saved in database, to automatically open encrypted workspaces with no enter password">
					<Checkbox label="Remember workspaces passwords" checked />
				</PreferencesOption>

				<h2 className={cnPreferences('Header')}>Encryption</h2>

				<PreferencesOption title="Encryption algorithm">
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
				</PreferencesOption>

				<PreferencesOption title="Password">
					<Button>Update password</Button>
				</PreferencesOption>

				<h2 className={cnPreferences('Header')}>Data</h2>

				<PreferencesOption
					title="Notes management"
					description="You may export and import notes as markdown files with attachments. Try it if you migrate from another note taking app"
				>
					<Stack direction="horizontal" spacing={2}>
						<Button>Import notes</Button>
						<Button>Export notes</Button>
					</Stack>
				</PreferencesOption>

				<PreferencesOption title="History">
					<Stack direction="vertical" spacing={2}>
						<Checkbox label="Enable history for notes" />
						<Checkbox label="Use recycle bin" />
					</Stack>
				</PreferencesOption>

				<h2 className={cnPreferences('Header')}>Synchronization</h2>

				<PreferencesOption description="Sync all data in database between your devices, to not loose it. All data are encrypted.">
					<Checkbox label="Enable synchronization" checked />
				</PreferencesOption>
				<PreferencesOption title="Synchronization method">
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
				</PreferencesOption>
				<PreferencesOption title="Synchronization directory">
					<Textinput
						placeholder="Enter path on directory"
						value="/foo/bar"
						disabled
					/>
				</PreferencesOption>
			</Stack>
		</Modal>
	);
};
