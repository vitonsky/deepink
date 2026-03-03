import { useEffect, useRef, useState } from 'react';
import { ConfigStorage } from '@core/storage/ConfigStorage';

export type RecentProfile = {
	isLoaded: boolean;
	profileId: string | null;
};

export const useRecentProfile = (config: ConfigStorage) => {
	const [recentProfile, setRecentProfile] = useState<RecentProfile>({
		isLoaded: false,
		profileId: null,
	});

	// Restore
	const isRestoredRef = useRef(false);
	useEffect(() => {
		if (isRestoredRef.current) return;

		config.get('activeProfile').then((activeProfile) => {
			isRestoredRef.current = true;
			setRecentProfile({
				isLoaded: true,
				profileId: activeProfile,
			});
		});
	}, [config]);

	return recentProfile;
};
