import React, { createContext, FC, HTMLProps, useContext } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cn } from '@bem-react/classname';

import { INotesRegistry } from '../../../../core/Registry';
import { ButtonObject } from '../../../api/buttons';
import { Icon } from '../../../components/Icon/Icon.bundle/common';
import { Stack } from '../../../components/Stack/Stack';

import './StatusBar.css';

export const cnStatusBar = cn('StatusBar');

export const StatusBarContext = createContext<{
	left: ButtonObject[];
	right: ButtonObject[];
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
