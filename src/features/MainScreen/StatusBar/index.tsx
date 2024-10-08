import React, { FC, HTMLProps } from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { cn } from '@bem-react/classname';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { Stack } from '@components/Stack/Stack';
import { useStatusBar } from '@features/MainScreen/StatusBar/StatusBarProvider';

import './StatusBar.css';

export const cnStatusBar = cn('StatusBar');

export type StatusBarProps = HTMLProps<HTMLDivElement>;

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = ({ className, ...props }) => {
	const { start, end } = useStatusBar();

	return (
		<div {...props} className={cnStatusBar({}, [className])}>
			<div className={cnStatusBar('LeftItems')}>
				{start.map((item, idx) =>
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
				{end.map((item, idx) =>
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
