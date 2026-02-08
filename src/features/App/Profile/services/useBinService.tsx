import { useEffect, useRef } from 'react';
import ms from 'ms';
import { DeletedNotesController } from '@core/features/notes/bin/DeletedNotesController';
import { NotesController } from '@core/features/notes/controller/NotesController';
import { useVaultSelector } from '@state/redux/profiles/hooks';
import {
	selectBinRetentionPolicy,
	selectWorkspacesSummary,
} from '@state/redux/profiles/selectors/vault';

import { useProfileControls } from '..';

export const useBinService = () => {
	const {
		profile: { db },
	} = useProfileControls();
	const workspaces = useVaultSelector(selectWorkspacesSummary);
	const { autoClean, cleanIntervalInMs } = useVaultSelector(selectBinRetentionPolicy);

	const stateRef = useRef<{
		context: symbol;
		service: null | Promise<any>;
	}>({
		context: Symbol(),
		service: null,
	});
	useEffect(() => {
		if (!autoClean) return;

		const instanceContext = Symbol();

		// Take context
		stateRef.current.context = instanceContext;
		async function startService() {
			// Wait a previous service will complete
			if (stateRef.current.service) await stateRef.current.service;

			// Check if context has not been changed after wait
			// Changed context means that another instance have been started
			// In that case we should exit and let another instance to run
			if (stateRef.current.context !== instanceContext) {
				return;
			}

			console.debug('Start a new bin auto deletion service...');

			const servicePromise = Promise.all(
				workspaces.map((workspace) => {
					const notes = new NotesController(db, workspace.id);
					const bin = new DeletedNotesController(
						{ notes },
						{ retentionTime: cleanIntervalInMs },
					);

					return bin.startService({
						onClean(count) {
							if (count === 0) return;

							console.warn(
								`${count} notes were permanently deleted from a workspace "${workspace.name}" due to expired retention policy ${ms(cleanIntervalInMs)}`,
							);
						},
					});
				}),
			).then((controls) => {
				return async function cleanup() {
					console.debug('Stop a bin auto deletion service...');

					// Stop services
					await Promise.all(controls.map((stop) => stop()));

					// Reset service promise
					if (stateRef.current.service === servicePromise) {
						stateRef.current.service = null;
					}
				};
			});

			stateRef.current.service = servicePromise;

			return servicePromise;
		}

		const serviceControls = startService();
		return () => {
			serviceControls.then((stopAll) => stopAll?.());
		};
	}, [db, autoClean, cleanIntervalInMs, workspaces]);
};
