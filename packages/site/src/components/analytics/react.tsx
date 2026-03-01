import React, { type PropsWithChildren, useState } from 'react';

import { PlausibleContext } from './useAnalytics';
import { createPlausibleInstance } from '.';

export const AnalyticsProvider = ({ children }: PropsWithChildren) => {
	const [{ plausible }] = useState(createPlausibleInstance);

	return <PlausibleContext value={plausible}>{children}</PlausibleContext>;
};
