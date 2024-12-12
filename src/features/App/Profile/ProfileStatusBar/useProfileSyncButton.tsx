import React, { useEffect } from 'react';
import { FaHardDrive } from 'react-icons/fa6';
import { useDebounce } from 'use-debounce';
import { Box } from '@chakra-ui/react';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

import { useProfileControls } from '..';

import styles from './ProfileStatusBar.module.css';

export const useProfileSyncButton = () => {
	const { controls } = useStatusBarManager();

	const {
		profile: { db },
	} = useProfileControls();

	const [isPending, setIsPending] = useDebounce(false, 900);
	useEffect(() => {
		return db.onSync((status) => {
			if (status === 'pending') {
				setIsPending(true);
				setIsPending.flush();
			} else {
				setIsPending(false);
			}
		});
	}, [db, setIsPending]);

	useEffect(() => {
		controls.update(
			'sync',
			{
				visible: true,
				title: 'Click to force save changes on disk',
				text: isPending ? 'Saving changes' : undefined,
				icon: (
					<Box
						sx={{
							animation: isPending
								? `${styles.blink} 900ms linear infinite`
								: undefined,
						}}
					>
						<FaHardDrive />
					</Box>
				),
				onClick: () => {
					db.sync();
				},
			},
			{
				placement: 'start',
				priority: 100000,
			},
		);
	}, [controls, db, isPending]);
};
