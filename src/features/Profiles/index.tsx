import React, { createContext, FC, PropsWithChildren } from 'react';
import { ProfilesApi } from '@state/profiles';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const profilesContext = createContext<ProfilesApi | null>(null);
export const useProfilesContext = createContextGetterHook(profilesContext);
export type ProfilesProps = PropsWithChildren<{
	profiles: ProfilesApi;
}>;
export const Profiles: FC<ProfilesProps> = ({ profiles, children }) => {
	// TODO: support multiple opened profiles
	return (
		<profilesContext.Provider value={profiles}>{children}</profilesContext.Provider>
	);
};
