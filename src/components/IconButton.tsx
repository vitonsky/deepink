import React, { forwardRef } from 'react';
import {
	IconButton as BaseIconButton,
	IconButtonProps as BaseIconButtonProps,
	Tooltip,
	TooltipProps,
} from '@chakra-ui/react';

export type IconButtonProps = Omit<BaseIconButtonProps, 'icon' | 'aria-label'> & {
	icon: Exclude<BaseIconButtonProps['icon'], void>;
	title: string;
	tooltipPlacement?: TooltipProps['placement'];
	tooltipProps?: TooltipProps;
};

export const IconButton = forwardRef<HTMLDivElement, IconButtonProps>(
	({ icon, title, tooltipPlacement, tooltipProps, ...buttonProps }, ref) => {
		return (
			<Tooltip
				label={title}
				hasArrow
				placement={tooltipPlacement}
				{...tooltipProps}
			>
				<BaseIconButton
					ref={ref}
					icon={icon}
					aria-label={title}
					{...buttonProps}
				/>
			</Tooltip>
		);
	},
);
