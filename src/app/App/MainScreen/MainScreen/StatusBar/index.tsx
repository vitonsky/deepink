import React, { FC, HTMLProps } from "react";
import { Button } from "react-elegant-ui/esm/components/Button/Button.bundle/desktop";
import { cn } from "@bem-react/classname";

import './StatusBar.css';

export const cnStatusBar = cn('StatusBar');

export type StatusBarProps = HTMLProps<HTMLDivElement> & {};

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = ({ className, ...props }) => {
	return <div {...props} className={cnStatusBar({}, [className])}>
		<Button size="s" view="action">Import</Button>
	</div>;
};