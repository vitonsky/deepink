import { createEvent, createStore } from 'effector';
import { ProfileObject } from '@core/storage/ProfilesManager';

export const createProfilesManagerApi = () => {
	const $profiles = createStore<null | ProfileObject[]>(null);
	const events = {
		profilesUpdated: createEvent<null | ProfileObject[]>(),
	};

	$profiles.on(events.profilesUpdated, (_state, payload) => payload);

	return {
		$profiles,
		events,
	};
};
