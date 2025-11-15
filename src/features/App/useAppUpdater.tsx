import React, { useCallback, useEffect } from 'react';
import ms from 'ms';
import { getAbout } from 'src/about';
import { Button, useToast } from '@chakra-ui/react';
import { AppToast } from '@components/AppToast';
import { GitHubReleaseUpdatesChecker } from '@electron/updates/GitHubReleaseUpdatesChecker';

export const useAppUpdater = () => {
	const ignoreFlagKey = 'ignoreUpdate';

	const toast = useToast();
	const ignoreUpdate = useCallback(() => {
		localStorage.setItem(ignoreFlagKey, String(new Date()));

		toast({
			position: 'top-right',
			containerStyle: {
				maxW: '250px',
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
	}, [toast]);

	useEffect(() => {
		// Ignore update if user decline
		const ignoreTime = localStorage.getItem(ignoreFlagKey);
		if (ignoreTime) {
			try {
				const ignoreTimestamp = new Date(ignoreTime).getTime();
				const timeDelta = Date.now() - ignoreTimestamp;

				if (timeDelta < ms('7 days')) return;
			} catch (error) {
				console.error(error);
				localStorage.removeItem(ignoreFlagKey);
			}
		}

		const appReleases = new GitHubReleaseUpdatesChecker({
			owner: 'vitonsky',
			repo: 'deepink',
		});

		appReleases
			.checkForUpdates({
				version: getAbout().version,
			})
			.then((newVersion) => {
				if (!newVersion) return;

				toast({
					duration: null,
					position: 'top-right',
					containerStyle: {
						maxW: '250px',
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
											variant="outline"
											onClick={() => {
												window.open(newVersion.url);
												localStorage.removeItem(ignoreFlagKey);
												props.onClose();
											}}
										>
											Update app
										</Button>
										<Button
											size="sm"
											variant="outline"
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
			});
	}, [ignoreUpdate, toast]);
};
