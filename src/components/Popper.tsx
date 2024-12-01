/* eslint-disable spellcheck/spell-checker */
import React, { useEffect, useState } from 'react';
import { usePopper } from 'react-popper';
import { Box, BoxProps, Portal } from '@chakra-ui/react';
import { computeStyles, flip, offset, preventOverflow } from '@popperjs/core';

export type PopperProps = BoxProps & {
	referenceRef?: HTMLElement;
	onClose?: () => void;
};

export const Popper = ({ referenceRef, onClose, children, ...props }: PopperProps) => {
	// Manage popper
	const [popperRef, setPopperRef] = useState<HTMLElement | null>(null);
	const popper = usePopper(referenceRef, popperRef, {
		placement: 'auto',
		modifiers: [
			{
				...computeStyles,
				options: {
					// Prevent scroll body
					gpuAcceleration: false,
				},
			},
			{ ...flip, options: { fallbackPlacements: ['bottom', 'top'] } },
			{ ...offset, options: { offset: [0, 10] } },
			{
				...preventOverflow,
				options: {
					mainAxis: true,
					altAxis: true,
					boundary: 'clippingParents',
					padding: 10,
				},
			} as const,
		],
	});

	// Close popup by click outside
	useEffect(() => {
		if (!popperRef) return;

		const onMouseDown = (evt: MouseEvent) => {
			const target = evt.target;
			if (!(target instanceof HTMLElement)) return;

			if (target !== popperRef && !popperRef.contains(target)) {
				if (onClose) {
					onClose();
				}
			}
		};

		document.addEventListener('mousedown', onMouseDown);
		return () => {
			document.removeEventListener('mousedown', onMouseDown);
		};
	}, [onClose, popperRef]);

	return children ? (
		<Portal>
			<Box
				ref={setPopperRef}
				tabIndex={0}
				{...props}
				style={{ ...popper.styles.popper, ...props.style }}
				onKeyUp={(evt) => {
					// Close by escape
					if (evt.key === 'Escape') {
						if (onClose) {
							onClose();
						}
					}
				}}
			>
				{children}
			</Box>
		</Portal>
	) : null;
};
