import React, { FC, HTMLProps, useCallback, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { Spinner } from 'react-elegant-ui/esm/components/Spinner/Spinner.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INotesRegistry } from '../../../../core/Registry';

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
	const importNotes = useImportNotes({ notesRegistry, updateNotes });

	const [isNotesImportInProgress, setIsNotesImportInProgress] = useState(false);
	const onImportNotes = useCallback(() => {
		setIsNotesImportInProgress(true);
		importNotes().finally(() => {
			setIsNotesImportInProgress(false);
		});
	}, [importNotes]);

	return (
		<div {...props} className={cnStatusBar({}, [className])}>
			<div className={cnStatusBar('ActionContainer')}>
				<Button
					size="s"
					view="action"
					onPress={onImportNotes}
					disabled={isNotesImportInProgress}
				>
					Import
				</Button>
			</div>
			<div className={cnStatusBar('StatusContainer')}>
				{isNotesImportInProgress && (
					<span className={cnStatusBar('ProgressIndicator')}>
						<span>Importing notes</span>
						<Spinner size="s" progress />
					</span>
				)}
			</div>
		</div>
	);
};
