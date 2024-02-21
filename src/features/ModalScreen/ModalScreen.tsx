import React, { FC, HTMLAttributes, ReactNode } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { FaXmark } from 'react-icons/fa6';
import { cn } from '@bem-react/classname';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { Modal } from '@components/Modal/Modal.bundle/Modal.desktop';

import './ModalScreen.css';

export const cnModalScreen = cn('ModalScreen');

export interface ModalScreenProps extends HTMLAttributes<HTMLDivElement> {
	isVisible?: boolean;
	onClose?: () => void;
	head?: ReactNode;
	footer?: ReactNode;
	title?: string;
}

export const ModalScreen: FC<ModalScreenProps> = ({
	isVisible,
	onClose,
	title,
	head,
	footer,
	children,
	...rest
}) => {
	return (
		<Modal
			visible={isVisible}
			onClose={onClose}
			renderToStack
			view="screen"
			{...rest}
		>
			<div className={cnModalScreen()}>
				{head && <div className={cnModalScreen('Head')}>{head}</div>}
				{Boolean(title || onClose) && (
					<div className={cnModalScreen('Head')}>
						{title && (
							<div className={cnModalScreen('HeadTitle')}>{title}</div>
						)}
						{onClose && (
							<Button
								view="clear"
								className={cnModalScreen('CloseButton')}
								onPress={onClose}
							>
								<Icon hasGlyph scalable boxSize="1rem">
									<FaXmark />
								</Icon>
							</Button>
						)}
					</div>
				)}

				<div className={cnModalScreen('Body')}>{children}</div>

				{footer && <div className={cnModalScreen('Footer')}>{footer}</div>}
			</div>
		</Modal>
	);
};
