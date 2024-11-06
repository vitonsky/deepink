import React, {
	ChangeEvent,
	ComponentType,
	createContext,
	FC,
	useCallback,
	useContext,
} from 'react';
import { Components } from 'react-markdown';

type PositionSegment = {
	line: number;
	column: number;
	offset?: number;
};

type Position = {
	start: PositionSegment;
	end: PositionSegment;
};

const itemSourceContext = createContext<Position | null>(null);

/**
 * Provide list item position in source text to a child nodes with a context
 */
export const ListItem: Exclude<Components['li'], undefined> = ({
	sourcePosition,
	ordered,
	children,
	...props
}) => {
	return (
		<itemSourceContext.Provider value={sourcePosition ?? null}>
			<li {...props}>
				<label>{children}</label>
			</li>
		</itemSourceContext.Provider>
	);
};

export type RequestCheckboxUpdate = (state: boolean, sourcePosition: Position) => void;

/**
 * Helper to extract props from `ComponentType`
 */
export type ExtractProps<T> = T extends ComponentType<infer K>
	? {
			[P in keyof K]: K[P];
	  }
	: never;

export type InputComponent = Exclude<Components['input'], undefined>;
type CheckboxProps = ExtractProps<InputComponent> & {
	updateCheckbox: RequestCheckboxUpdate;
};

/**
 * Be sure this component used with `ListItem`
 */
export const Checkbox: FC<CheckboxProps> = ({
	sourcePosition: _sourcePosition,
	updateCheckbox,
	...props
}) => {
	const sourcePosition = useContext(itemSourceContext);
	const onChange = useCallback(
		(evt: ChangeEvent<HTMLInputElement>) => {
			const isChecked = evt.currentTarget.checked;

			if (!sourcePosition) return;
			updateCheckbox(isChecked, sourcePosition);
		},
		[sourcePosition, updateCheckbox],
	);

	const isCheckboxLocked =
		!sourcePosition ||
		sourcePosition.start.offset === undefined ||
		sourcePosition.end.offset === undefined;

	return (
		<input
			{...props}
			disabled={isCheckboxLocked}
			checked={Boolean(props.checked)}
			onChange={onChange}
		/>
	);
};
