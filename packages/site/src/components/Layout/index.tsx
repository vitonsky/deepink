import React, { type ComponentType } from 'react';

import Layout, { type LayoutProps } from './Layout';

export function WithLayout<T extends {}>(Component: ComponentType<T>) {
	function Wrapper({ i18n, ...props }: Pick<LayoutProps, 'i18n'> & T) {
		return (
			<Layout i18n={i18n}>
				<Component {...(props as unknown as T)} />
			</Layout>
		);
	}

	(Wrapper as ComponentType).displayName = `WithLayout(${Component.displayName})`;

	return Wrapper;
}
