import { Button } from '@chakra-ui/react';

import { WithFocusRedirect } from './WithFocusRedirect';

/**
 * Basic button wrapped to a container that keeps external geometry,
 * even if button have CSS transformations
 */
export const CalmButton = WithFocusRedirect(Button);
