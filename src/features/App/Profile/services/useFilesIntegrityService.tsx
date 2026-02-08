import { useEffect } from 'react';
import ms from 'ms';
import { AttachmentsController } from '@core/features/attachments/AttachmentsController';
import { FilesController } from '@core/features/files/FilesController';
import { FilesIntegrityController } from '@core/features/integrity/FilesIntegrityController';
import { ElectronFilesController, storageApi } from '@electron/requests/storage/renderer';
import { useService } from '@hooks/useService';
import { useVaultSelector } from '@state/redux/profiles/hooks';
import {
	selectIntegrityServiceConfig,
	selectWorkspacesSummary,
} from '@state/redux/profiles/selectors/vault';
import { wait } from '@utils/time';

import { useProfileControls } from '..';

export const useFilesIntegrityService = () => {
	const {
		profile: {
			db,
			profile: { id: profileId },
			encryptionController,
		},
	} = useProfileControls();
	const workspaces = useVaultSelector(selectWorkspacesSummary);
	const { enabled: isServiceEnabled } = useVaultSelector(selectIntegrityServiceConfig);

	const runService = useService();

	useEffect(() => {
		if (!isServiceEnabled) return;

		return runService(async () => {
			console.debug('Start files integrity service...');
			console.warn(
				'Files integrity service will delete a files that is not mentioned in any note. Note snapshots is not considered as reference sources, so you may lost files that mentioned only in history.',
			);

			const controls = await Promise.all(
				workspaces.map((workspace) => {
					const filesController = new ElectronFilesController(
						storageApi,
						[profileId, 'files'].join('/'),
						encryptionController,
					);

					return new FilesIntegrityController(workspace.id, filesController, {
						attachments: new AttachmentsController(db, workspace.id),
						files: new FilesController(db, filesController, workspace.id),
					});
				}),
			);

			const abortController = new AbortController();
			const abortSignal = abortController.signal;

			const workerPromise = new Promise<void>(async (res) => {
				const abortPromise = new Promise<void>((res) =>
					abortSignal.addEventListener('abort', () => res(), { once: true }),
				);

				while (true) {
					if (abortSignal.aborted) {
						res();
						return;
					}

					await Promise.race([wait(ms('5m')), abortPromise]);
					if (abortSignal.aborted) {
						res();
						return;
					}

					Promise.all(controls.map((control) => control.fixAll()));
					if (abortSignal.aborted) {
						res();
						return;
					}

					await Promise.race([wait(ms('5h')), abortPromise]);
				}
			});

			return async () => {
				console.debug('Stop a files integrity service...');

				// Stop services
				abortController.abort();
				await workerPromise;
			};
		});
	}, [isServiceEnabled, db, encryptionController, profileId, runService, workspaces]);
};
