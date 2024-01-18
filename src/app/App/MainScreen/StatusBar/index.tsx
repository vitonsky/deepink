import React, { FC, HTMLProps } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import {
	FaArrowsRotate,
	FaBell,
	FaClockRotateLeft,
	FaCompress,
	FaDatabase,
	FaLock,
} from 'react-icons/fa6';
import { cn } from '@bem-react/classname';

import { INotesRegistry } from '../../../../core/Registry';
import { changedActiveProfile } from '../../../../core/state/profiles';
import { Icon } from '../../../components/Icon/Icon.bundle/common';
import { Stack } from '../../../components/Stack/Stack';

import './StatusBar.css';

export const cnStatusBar = cn('StatusBar');

export type StatusBarProps = HTMLProps<HTMLDivElement> & {
	notesRegistry: INotesRegistry;
	updateNotes: () => void;
};

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = ({
	className,
	notesRegistry,
	updateNotes,
	...props
}) => {
	return (
		<div {...props} className={cnStatusBar({}, [className])}>
			<div className={cnStatusBar('ActionContainer')}>
				<Button
					size="s"
					view="clear"
					title="Change database"
					onClick={() => changedActiveProfile(null)}
				>
					<Icon hasGlyph boxSize="1rem">
						<FaDatabase />
					</Icon>
				</Button>
				<Button size="s" view="clear" title="Lock database">
					<Icon hasGlyph boxSize="1rem">
						<FaLock />
					</Icon>
				</Button>
				<Button size="s" view="clear" title="Sync changes">
					<Icon hasGlyph boxSize="1rem">
						<FaArrowsRotate />
					</Icon>
				</Button>
			</div>
			<div className={cnStatusBar('StatusContainer')}>
				<Button size="s" view="clear" title="History">
					<Stack direction="horizontal">
						<Icon hasGlyph boxSize="1rem">
							<FaClockRotateLeft />
						</Icon>
						<span>{new Date().toLocaleDateString()}</span>
					</Stack>
				</Button>
				<Button size="s" view="clear" title="Focus mode">
					<Icon hasGlyph boxSize="1rem">
						<FaCompress />
					</Icon>
				</Button>
				<Button size="s" view="clear" title="Notifications">
					<Icon hasGlyph boxSize="1rem">
						<FaBell />
					</Icon>
				</Button>
			</div>
		</div>
	);
};
