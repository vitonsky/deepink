import { createEvent, createStore } from 'effector';

export type Profile = {
	id: string;
	name: string;
	isEncrypted: boolean;
};

export const $activeProfile = createStore<Profile | null>(null);
export const changedActiveProfile = createEvent<Profile | null>();
$activeProfile.on(changedActiveProfile, (_, profile) => profile);

export const $profiles = createStore<Profile[]>([]);
