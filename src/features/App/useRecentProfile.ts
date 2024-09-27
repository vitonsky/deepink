import { useEffect, useRef, useState } from 'react';
import { ConfigStorage } from '@core/storage/ConfigStorage';

export const useRecentProfile = (config: ConfigStorage) => {
	const [profileId, setProfileId] = useState<{
		isLoaded: boolean;
		profileId: string | null;
	}>({
		isLoaded: false,
		profileId: null,
	});

	// Restore
	const isRestoredRef = useRef(false);
	useEffect(() => {
		if (isRestoredRef.current) return;

		config.get('activeProfile').then((activeProfile) => {
			isRestoredRef.current = true;
			setProfileId({
				isLoaded: true,
				profileId: activeProfile,
			});
		});
	}, [config]);

	return profileId;
};
