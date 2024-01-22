import { withModTabsMenuLayoutHorizontal } from 'react-elegant-ui/esm/components/TabsMenu/_layout/TabsMenu_layout_horizontal';
import { withModTabsMenuLayoutVertical } from 'react-elegant-ui/esm/components/TabsMenu/_layout/TabsMenu_layout_vertical';
import { withModTabsMenuSizeM } from 'react-elegant-ui/esm/components/TabsMenu/_size/TabsMenu_size_m';
import { withModTabsMenuSizeS } from 'react-elegant-ui/esm/components/TabsMenu/_size/TabsMenu_size_s';
import { TabsMenu as BaseTabsMenu } from 'react-elegant-ui/esm/components/TabsMenu/TabsMenu';
import { TabsMenuDesktopRegistry } from 'react-elegant-ui/esm/components/TabsMenu/TabsMenu.registry/desktop';
import { compose, composeU } from 'react-elegant-ui/esm/lib/compose';
import { withRegistry } from 'react-elegant-ui/esm/lib/di';

import { withModTabsMenuViewPrimary } from './_view/TabsMenu_view_primary';

// TODO: move `withRegistry` to `compose`
export const TabsMenu = compose(
	composeU(withModTabsMenuViewPrimary),
	composeU(withModTabsMenuLayoutVertical, withModTabsMenuLayoutHorizontal),
	composeU(withModTabsMenuSizeM, withModTabsMenuSizeS),
)(withRegistry(TabsMenuDesktopRegistry)(BaseTabsMenu));

TabsMenu.defaultProps = {
	view: 'primary',
	layout: 'horizontal',
};
