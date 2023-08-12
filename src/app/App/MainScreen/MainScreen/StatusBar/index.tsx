import React, { FC, HTMLProps } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INotesRegistry } from '../../../../../core/Registry';

import { useImportNotes } from './buttons/useImportNotes';

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
	const onImportNotes = useImportNotes({ notesRegistry, updateNotes, });

	return (
		<div {...props} className={cnStatusBar({}, [className])}>
			<Button size="s" view="action" onPress={onImportNotes}>
				Import
			</Button>
		</div>
	);
};
