import { createEvent, createStore } from 'effector';
import { ProfileObject } from '@core/storage/ProfilesManager';
import { NewProfile } from '@features/WorkspaceManager/ProfileCreator';

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

export type ProfilesManagerApi = {
	profiles: ProfileObject[] | null;
	createProfile: (profile: NewProfile) => Promise<void>;
};
