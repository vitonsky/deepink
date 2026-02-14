import React from 'react';
import { Features } from '@components/Features/Features';

import { Appearance } from './Appearance';
import { EditorConfig } from './EditorConfig';

export const AppearanceSettings = () => {
	return (
		<Features>
			<Appearance />
			<EditorConfig />
		</Features>
	);
};
