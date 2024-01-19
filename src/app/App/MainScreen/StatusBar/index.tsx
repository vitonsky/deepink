import React, { createContext, FC, HTMLProps, ReactNode, useContext } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INotesRegistry } from '../../../../core/Registry';
import { Icon } from '../../../components/Icon/Icon.bundle/common';
import { Stack } from '../../../components/Stack/Stack';

import './StatusBar.css';

export const cnStatusBar = cn('StatusBar');

export type StatusBarButton = {
	visible: boolean;
	onClick?: () => void;
	title?: string;
} & (
	| {
			icon: ReactNode;
			text?: string;
	  }
	| {
			icon?: ReactNode;
			text: string;
	  }
);

export const StatusBarContext = createContext<{
	left: StatusBarButton[];
	right: StatusBarButton[];
}>({
	left: [],
	right: [],
});

export type StatusBarProps = HTMLProps<HTMLDivElement> & {
	notesRegistry: INotesRegistry;
	updateNotes: () => void;
};

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = ({
	className,
	notesRegistry,
	updateNotes,
	...props
}) => {
	const { left, right } = useContext(StatusBarContext);

	return (
		<div {...props} className={cnStatusBar({}, [className])}>
			<div className={cnStatusBar('LeftItems')}>
				{left.map((item, idx) =>
					item.visible ? (
						<Button
							key={idx}
							size="s"
							view="clear"
							title={item.title}
							onClick={item.onClick}
						>
							<Stack direction="horizontal">
								{item.icon && (
									<Icon hasGlyph boxSize="1rem">
										{item.icon}
									</Icon>
								)}
								{item.text && <span>{item.text}</span>}
							</Stack>
						</Button>
					) : undefined,
				)}
			</div>

			<div className={cnStatusBar('RightItems')}>
				{right.map((item, idx) =>
					item.visible ? (
						<Button
							key={idx}
							size="s"
							view="clear"
							title={item.title}
							onClick={item.onClick}
						>
							<Stack direction="horizontal">
								{item.icon && (
									<Icon hasGlyph boxSize="1rem">
										{item.icon}
									</Icon>
								)}
								{item.text && <span>{item.text}</span>}
							</Stack>
						</Button>
					) : undefined,
				)}
			</div>
		</div>
	);
};
