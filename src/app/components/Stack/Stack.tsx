import React, { forwardRef, HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '@bem-react/classname';

import './Stack.css';

export const cnStack = cn('Stack');

export interface IStackProps extends HTMLAttributes<HTMLDivElement> {
	direction: 'vertical' | 'horizontal';
	spacing?: number;
}

export const Stack = forwardRef<HTMLDivElement, PropsWithChildren<IStackProps>>(
	({ direction, spacing = 1, children, ...props }, ref) => {
		return (
			<div
				ref={ref}
				{...props}
				className={cnStack({ direction }, [props.className])}
				style={{ gap: `calc(var(--stack-spacing) * ${spacing})` }}
			>
				{children}
			</div>
		);
	},
);
