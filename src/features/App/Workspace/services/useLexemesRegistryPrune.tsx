import { useEffect } from 'react';
import { WorkspaceEvents } from '@api/events/workspace';
import { joinCallbacks } from '@utils/react/joinCallbacks';

import { useProfileControls } from '../../Profile';

import { useEventBus } from '../WorkspaceProvider';

// TODO: prune iteratively
export const useLexemesRegistryPrune = () => {
	const events = useEventBus();
	const {
		api: { lexemes },
	} = useProfileControls();

	useEffect(() => {
		const PRUNE_DELAY = 5000;

		let timer: NodeJS.Timeout | null = null;
		let cbId: number | null = null;
		const schedulePrune = () => {
			// Delay action
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			if (cbId) {
				cancelIdleCallback(cbId);
				cbId = null;
			}

			timer = setTimeout(() => {
				timer = null;
				cbId = requestIdleCallback(() => {
					cbId = null;
					lexemes.prune().then((words) => {
						console.debug('Lexemes has been pruned', words.length);
					});
				});
			}, PRUNE_DELAY);
		};

		return joinCallbacks(
			events.listen(WorkspaceEvents.NOTES_UPDATED, schedulePrune),
			events.listen(WorkspaceEvents.NOTE_UPDATED, schedulePrune),
			events.listen(WorkspaceEvents.NOTE_EDITED, schedulePrune),
			() => {
				if (timer) {
					clearTimeout(timer);
				}
			},
		);
	}, [events, lexemes]);
};
