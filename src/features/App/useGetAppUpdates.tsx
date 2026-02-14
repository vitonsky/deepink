import React, { useCallback } from 'react';
import ms from 'ms';
import { getAbout } from 'src/about';
import { Button, useToast, UseToastOptions } from '@chakra-ui/react';
import { AppToast } from '@components/AppToast';
import { GitHubReleaseUpdatesChecker } from '@electron/updates/GitHubReleaseUpdatesChecker';
import { getDevFlag } from '@utils/dev';

export const useGetAppUpdates = () => {
	const ignoreFlagKey = 'ignoreUpdate';

	const toast = useToast();
	const showToast = useCallback(
		(options?: UseToastOptions) => {
			const toastId = 'newVersion';

			toast.close(toastId);
			requestAnimationFrame(() => {
				toast({
					...options,
					id: toastId,
				});
			});
		},
		[toast],
	);

	const ignoreUpdate = useCallback(() => {
		localStorage.setItem(ignoreFlagKey, String(new Date()));

		showToast({
			position: 'top-right',
			containerStyle: {
				maxW: '350px',
			},
			render() {
				return (
					<AppToast
						title="App update"
						body="The reminder will be shown week later"
					/>
				);
			},
		});
	}, [showToast]);

	return useCallback(
		async (forceCheck = false) => {
			// Ignore update if user decline
			const ignoreTime = localStorage.getItem(ignoreFlagKey);
			if (!forceCheck && ignoreTime) {
				try {
					const ignoreTimestamp = new Date(ignoreTime).getTime();
					const timeDelta = Date.now() - ignoreTimestamp;

					if (timeDelta < ms('7 days')) return null;
				} catch (error) {
					console.error(error);
					localStorage.removeItem(ignoreFlagKey);
				}
			}

			const appReleases = new GitHubReleaseUpdatesChecker({
				owner: 'vitonsky',
				repo: 'deepink',
			});

			return appReleases
				.checkForUpdates({
					version: getDevFlag('version') ?? getAbout().version,
				})
				.then((newVersion) => {
					if (!newVersion) return null;

					showToast({
						duration: null,
						position: 'top-right',
						containerStyle: {
							maxW: '350px',
						},
						render(props) {
							return (
								<AppToast
									title="New version is available"
									body="Update app to a latest version to get new features and improvements"
									actions={
										<>
											<Button
												size="sm"
												variant="accent"
												onClick={() => {
													window.open(newVersion.url);
													localStorage.removeItem(
														ignoreFlagKey,
													);
													props.onClose();
												}}
											>
												Download new version
											</Button>
											<Button
												size="sm"
												onClick={() => {
													props.onClose();
													ignoreUpdate();
												}}
											>
												Ignore
											</Button>
										</>
									}
								/>
							);
						},
					});

					return newVersion;
				});
		},
		[ignoreUpdate, showToast],
	);
};
