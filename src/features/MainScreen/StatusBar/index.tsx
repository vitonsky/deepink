import React, {
	createContext,
	FC,
	HTMLProps,
	PropsWithChildren,
	useContext,
} from 'react';
import { Button } from 'react-elegant-ui/esm/components/Button/Button.bundle/desktop';
import { ButtonsManagerObject, useButtonsManager } from '@api/buttons/useButtonsManager';
import { cn } from '@bem-react/classname';
import { Icon } from '@components/Icon/Icon.bundle/common';
import { Stack } from '@components/Stack/Stack';
import { INotesController } from '@core/features/notes/controller';

import './StatusBar.css';

export const BottomPanelManagerContext = createContext<ButtonsManagerObject>(
	null as unknown as ButtonsManagerObject,
);

export const useBottomPanelManager = () => {
	return useContext(BottomPanelManagerContext);
};

export const cnStatusBar = cn('StatusBar');

export const StatusBarContext = createContext<ButtonsManagerObject['state']>({
	start: [],
	end: [],
});

export const StatusBarProvider: FC<PropsWithChildren> = ({ children }) => {
	const buttonsManager = useButtonsManager();

	return (
		<StatusBarContext.Provider value={buttonsManager.state}>
			<BottomPanelManagerContext.Provider value={buttonsManager}>
				{children}
			</BottomPanelManagerContext.Provider>
		</StatusBarContext.Provider>
	);
};

export type StatusBarProps = HTMLProps<HTMLDivElement> & {
	notesRegistry: INotesController;
	updateNotes: () => void;
};

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = ({
	className,
	notesRegistry,
	updateNotes,
	...props
}) => {
	const { start, end } = useContext(StatusBarContext);

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
