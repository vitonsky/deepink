import React, { Fragment, useMemo } from 'react';
import { Box, Divider, HStack, Text } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesPanel } from '@components/Features/Group';
import { SHORTCUT_NAMES } from '@hooks/commands';
import { shortcuts } from '@hooks/commands/shortcuts';

// TODO: implement recording view
export const KeyboardShortcut = ({ shortcut }: { shortcut?: string }) => {
	const keys = useMemo(() => {
		if (!shortcut) return [];

		const isMacOS = navigator.userAgent.includes('Mac OS');
		return shortcut
			.split('+')
			.map((k) => k.trim().replaceAll(/cmdorctrl/gi, isMacOS ? 'Cmd' : 'Ctrl'))
			.filter(Boolean);
	}, [shortcut]);

	// TODO: use icons for some buttons
	return (
		<Box
			padding=".2rem .5rem"
			fontSize=".8rem"
			backgroundColor="dim.200"
			borderRadius="6px"
			cursor="default"
			userSelect="none"
		>
			{keys.length > 0 ? keys.join(' + ') : 'Blank'}
		</Box>
	);
};

export const HotKeysSettings = () => {
	return (
		<Features>
			<FeaturesPanel padding="1rem">
				{Object.entries(shortcuts).map(([shortcuts, command], index) => {
					return (
						<Fragment key={command}>
							{index > 0 && <Divider />}
							<HStack w="100%">
								<Text>{SHORTCUT_NAMES[command]}</Text>
								<Box marginInlineStart="auto">
									<KeyboardShortcut shortcut={shortcuts} />
								</Box>
							</HStack>
						</Fragment>
					);
				})}
			</FeaturesPanel>
		</Features>
	);
};
