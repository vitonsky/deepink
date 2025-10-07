import React, { forwardRef, JSX, useCallback, useEffect, useRef } from 'react';

/**
 * HOC that wrap component to a container that will always redirect focus from itself to a target component.
 *
 * Useful when we have to keep external geometry while CSS transformations.
 * For example, if button bounce while click, and we want to prevent bounce of bound popover.
 */
export const WithFocusRedirect = <C extends React.ElementType>(Component: C) =>
	forwardRef<HTMLElement, JSX.LibraryManagedAttributes<C, any>>((props, ref) => {
		const rootRef = useRef<HTMLElement | null>(null);
		const componentRef = useRef<HTMLElement>(null);
		useEffect(() => {
			const rootElement = rootRef.current;
			if (!rootElement) return;

			const forceFocus = () => {
				componentRef.current?.focus();
			};

			rootElement.addEventListener('focus', forceFocus);
			return () => {
				rootElement.removeEventListener('focus', forceFocus);
			};
		}, []);

		const redirectRef = useCallback(
			(node: HTMLElement | null) => {
				rootRef.current = node;
				if (ref) {
					if (typeof ref === 'function') {
						ref(node);
					} else {
						ref.current = node;
					}
				}
			},
			[ref],
		);

		return (
			<span
				ref={redirectRef}
				// Allow programmable focus
				tabIndex={-1}
			>
				<Component {...(props as any)} ref={componentRef} />
			</span>
		);
	}) as unknown as C;
