import { ProfileObject } from '@core/storage/ProfilesManager';

type PickProfileResponse = { status: 'ok' } | { status: 'error'; message: string };

export type OnPickProfile = (
	profile: ProfileObject,
	password?: string,
) => Promise<PickProfileResponse>;
