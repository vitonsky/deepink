import {
	cnTabsMenu,
	ITabsMenuProps,
} from 'react-elegant-ui/esm/components/TabsMenu/TabsMenu';
import { withClassnameHOC } from 'react-elegant-ui/esm/lib/compose';

import './TabsMenu_view_primary.css';

export interface IModTabsMenuViewPrimary {
	view?: 'primary';
}

/**
 * Modifier responsible for appearance of tabs
 */
export const withModTabsMenuViewPrimary = withClassnameHOC<
	IModTabsMenuViewPrimary,
	ITabsMenuProps
>(cnTabsMenu(), { view: 'primary' });
