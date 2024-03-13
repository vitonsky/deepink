import { combine, createApi, createEvent, createStore, sample } from 'effector';
import { useProfiles } from '@features/App/useProfiles';
import { DisposableBox } from '@utils/disposable';

export type ProfileEntry = {
	id: string;
	name: string;
	isEncrypted: boolean;
};

// TODO: refactor to use one store and events instead of reducers
export const createProfilesApi = <T extends DisposableBox<unknown>>(
	autoChangeActiveProfile = true,
) => {
	const $activeProfile = createStore<T | null>(null);

	const $profiles = createStore<T[]>([]);
	const profiles = createApi($profiles, {
		add(state: T[], newProfile: T) {
			return [...state, newProfile];
		},
		delete(state: T[], deletedProfile: T) {
			return state.filter((profile) => profile !== deletedProfile);
		},
	});

	const $combinedStore = combine({
		activeProfile: $activeProfile,
		profiles: $profiles,
	});

	const profileOpened = createEvent<T>();
	// Cast type due to bug in types https://github.com/effector/effector/issues/1048
	profileOpened.watch(profiles.add as any);
	$activeProfile.on(profileOpened, (_state, profile) => profile);

	const profileClosed = createEvent<T>();
	// Cast type due to bug in types https://github.com/effector/effector/issues/1048
	profileClosed.watch(profiles.delete as any);

	// Dispose container
	profileClosed.watch((profile) => {
		if (!profile.isDisposed()) {
			profile.dispose();
		}
	});

	// Update active profile
	sample({
		clock: profileClosed,
		source: $combinedStore,
		filter({ activeProfile }, profile) {
			return activeProfile === profile;
		},
		fn({ profiles }, closedProfile) {
			if (!autoChangeActiveProfile) return null;

			return (
				[...profiles].reverse().find((profile) => profile !== closedProfile) ??
				null
			);
		},
		target: $activeProfile,
	});

	const activeProfileChanged = createEvent<T | null>();

	// Set active profile
	sample({
		clock: activeProfileChanged,
		source: $combinedStore,
		filter({ activeProfile, profiles }, profile) {
			if (profile === null) return true;

			return profile !== activeProfile && profiles.includes(profile);
		},
		fn(_state, newActiveProfile) {
			return newActiveProfile;
		},
		target: $activeProfile,
	});

	const activeProfileCloseRequested = createEvent();
	sample({
		clock: activeProfileCloseRequested,
		source: $activeProfile,
	}).watch((activeProfile) => {
		if (activeProfile !== null) {
			profileClosed(activeProfile);
		}
	});

	return {
		$activeProfile,
		$profiles,
		events: {
			activeProfileChanged,
			activeProfileCloseRequested,
			profileOpened,
			profileClosed,
		},
	};
};

export type ProfilesApi = ReturnType<typeof useProfiles>;
