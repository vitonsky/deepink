import React from 'react';
import { Box, BoxProps, Portal } from '@chakra-ui/react';
import {
	autoPlacement,
	autoUpdate,
	hide,
	offset,
	shift,
	useDismiss,
	useFloating,
	useInteractions,
} from '@floating-ui/react';

export type PopperProps = BoxProps & {
	referenceRef?: HTMLElement;
	onClose?: () => void;
};

export const Popper = ({ referenceRef, onClose, children, ...props }: PopperProps) => {
	// Manage popper
	const { refs, floatingStyles, context } = useFloating({
		open: true,
		onOpenChange: (open) => {
			if (!open && onClose) onClose();
		},
		strategy: 'fixed',
		middleware: [
			offset({ mainAxis: 2 }),
			hide(),
			shift(),
			autoPlacement({
				allowedPlacements: ['top', 'top-end', 'top-start'],
			}),
		],
		whileElementsMounted: autoUpdate,
		elements: {
			reference: referenceRef,
		},
	});

	const dismiss = useDismiss(context);
	const { getFloatingProps } = useInteractions([dismiss]);

	return children ? (
		<Portal>
			<Box
				ref={refs.setFloating}
				tabIndex={0}
				{...props}
				style={{ ...floatingStyles, ...props.style }}
				{...getFloatingProps()}
			>
				{children}
			</Box>
		</Portal>
	) : null;
};
