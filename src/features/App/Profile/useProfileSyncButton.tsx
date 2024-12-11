import React, { useEffect } from 'react';
import { FaArrowsRotate } from 'react-icons/fa6';
import { useDebounce } from 'use-debounce';
import { Box } from '@chakra-ui/react';
import { useStatusBarManager } from '@features/MainScreen/StatusBar/StatusBarProvider';

import { useProfileControls } from '.';

import styles from './profile.module.css';

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
				title: 'Synchronize profile data',
				text: 'Synchronize',
				icon: (
					<Box
						sx={{
							animation: isPending
								? `${styles.spinner} 700ms linear infinite`
								: undefined,
						}}
					>
						<FaArrowsRotate />
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
