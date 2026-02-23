import type React from 'react';
import { Box } from '@chakra-ui/react';

import LogoIcon from './logo.svg?react';

// TODO: use just an SVG element
export const Logo = () => {
	return <Box as={LogoIcon} display="inline-block" width="8em" height="auto" />;
};
