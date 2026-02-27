import React, { type PropsWithChildren } from 'react';
import { VStack } from '@chakra-ui/react';

import { WithLayout } from '../components/Layout';

export const StaticPage = WithLayout(function Page({ children }: PropsWithChildren) {
	return (
		<VStack
			align="start"
			paddingTop="1rem"
			paddingBottom="10rem"
			width="100%"
			marginInline="auto"
			gap={0}
		>
			{children}
		</VStack>
	);
});
