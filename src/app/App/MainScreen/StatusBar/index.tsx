import React, { FC, HTMLProps, useCallback, useState } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INotesRegistry } from '../../../../core/Registry';
import { changedActiveProfile } from '../../../../core/state/profiles';
import { Spinner } from '../../../components/Spinner';

import { ExportButton } from './buttons/ExportButton';
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
				<ExportButton />
				<Button
					size="s"
					view="default"
					onClick={() => changedActiveProfile(null)}
				>
					Change profile
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
