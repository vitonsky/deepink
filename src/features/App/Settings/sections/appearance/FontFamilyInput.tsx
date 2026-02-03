import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Downshift from 'downshift';
import { IFontInfo } from 'font-list';
import {
	Box,
	BoxProps,
	Input,
	InputProps,
	ListItem,
	Text,
	UnorderedList,
} from '@chakra-ui/react';
import { Popper } from '@components/Popper';
import { getFontsList } from '@electron/requests/interop/renderer';
import {
	ReactVirtualizerOptions,
	useVirtualizer,
	Virtualizer,
} from '@tanstack/react-virtual';

export const VirtualList = ({
	children,
	activeIndex,
	...props
}: Partial<ReactVirtualizerOptions<HTMLDivElement, HTMLLIElement>> &
	Pick<
		ReactVirtualizerOptions<HTMLDivElement, HTMLLIElement>,
		'count' | 'getScrollElement' | 'estimateSize'
	> & {
		children: (virtualizer: Virtualizer<HTMLDivElement, HTMLLIElement>) => ReactNode;
		activeIndex?: number;
	}) => {
	const virtualizer = useVirtualizer(props);

	useEffect(() => {
		if (activeIndex === undefined) return;

		console.log('activeIndex', activeIndex);
		virtualizer.scrollToIndex(activeIndex);
	}, [activeIndex, virtualizer]);

	return children(virtualizer);
};

// TODO: open list when user click input
export const SimpleComboBox = <T extends unknown>({
	autoFocusItem,

	items,
	itemToString,
	renderItem,

	placeholder,
	inputProps,
	inputValue,
	onInputChange,
	...props
}: {
	placeholder?: string;
	inputProps?: InputProps;

	inputValue?: string;
	onInputChange?: (inputValue: string) => void;

	autoFocusItem?: boolean;

	items: T[];
	itemToString: (item: T | null) => string;
	renderItem: (item: T) => ReactNode;
} & BoxProps) => {
	const listRootRef = useRef<HTMLDivElement>(null);
	const [inputRef, setInputRef] = useState<HTMLDivElement>();

	return (
		<Downshift
			inputValue={inputValue}
			onInputValueChange={(value) => {
				onInputChange?.(value ?? '');
			}}
			itemCount={items.length}
			itemToString={itemToString}
			defaultHighlightedIndex={autoFocusItem ? 0 : undefined}
			stateReducer={(state, changes) => {
				// Clear input only by second escape press
				if (
					changes.type === Downshift.stateChangeTypes.keyDownEscape &&
					(items.length === 0 || !state.isOpen)
				) {
					return changes;
				}

				return {
					...changes,
					inputValue: state.inputValue,
				};
			}}
		>
			{({
				getInputProps,
				getItemProps,
				getMenuProps,
				isOpen,
				getRootProps,
				highlightedIndex,
			}) => {
				return (
					<Box w="100%" position="relative" {...props}>
						<Box
							display="inline-block"
							w="100%"
							{...getRootProps({}, { suppressRefError: true })}
						>
							<Input
								{...getInputProps()}
								{...{ placeholder, ...inputProps }}
								w="100%"
								ref={setInputRef}
							/>
						</Box>

						{isOpen && items.length > 0 && renderItem && (
							<Popper
								referenceRef={inputRef ?? undefined}
								allowedPlacements={['top', 'bottom']}
								offset={{ mainAxis: 5 }}
								zIndex={999999}
							>
								<VirtualList
									count={items.length}
									activeIndex={highlightedIndex ?? undefined}
									getScrollElement={() => listRootRef.current}
									estimateSize={() => 40}
									overscan={6}
								>
									{(virtualizer) => {
										return (
											<Box
												ref={listRootRef}
												width="400px"
												maxHeight="inherit"
												overflow="auto"
												border="1px solid"
												borderColor="surface.border"
												backgroundColor="surface.background"
												borderRadius="6px"
											>
												<UnorderedList
													{...getMenuProps()}
													minHeight={virtualizer.getTotalSize()}
													paddingBlock=".3rem"
													margin={0}
													flexShrink={0}
												>
													{virtualizer
														.getVirtualItems()
														.map(
															(
																virtualRow,
																virtualItemPosition,
															) => {
																const item =
																	items[
																		virtualRow.index
																	];

																return (
																	<ListItem
																		{...getItemProps({
																			key: virtualRow.index,
																			index: virtualRow.index,
																			item,
																		})}
																		ref={
																			virtualizer.measureElement
																		}
																		key={
																			virtualRow.index
																		}
																		data-index={
																			virtualRow.index
																		}
																		listStyleType="none"
																		width="100%"
																		// Set margin for first rendered item, to offset all items above
																		// That is necessary to show user items slice after scroll
																		marginTop={
																			virtualItemPosition ===
																			0
																				? virtualRow.start
																				: undefined
																		}
																	>
																		{renderItem(item)}
																	</ListItem>
																);
															},
														)}
												</UnorderedList>
											</Box>
										);
									}}
								</VirtualList>
							</Popper>
						)}
					</Box>
				);
			}}
		</Downshift>
	);
};

export const FontFamilyInput = ({
	placeholder,
	value,
	onChange,
	fontSize,
	...props
}: Omit<BoxProps, 'onChange'> & {
	placeholder?: string;
	inputProps?: InputProps;

	value?: string;
	onChange?: (fontFamily: string) => void;
}) => {
	// Suggests list
	const [fonts, setFonts] = useState<IFontInfo[]>([]);
	useEffect(() => {
		getFontsList().then(setFonts);
	}, []);

	const fontSuggests = useMemo(() => {
		if (!value) return fonts;

		return fonts.filter(
			(info) =>
				value === null || info.name.toLowerCase().includes(value.toLowerCase()),
		);
	}, [fonts, value]);

	return (
		<SimpleComboBox
			{...props}
			inputValue={value}
			onInputChange={onChange}
			itemToString={(item) => item?.name ?? ''}
			items={fontSuggests}
			renderItem={(item) => (
				<Text
					fontSize={fontSize}
					fontFamily={item.familyName}
					maxWidth="100%"
					padding=".3rem 1rem"
					overflow="hidden"
					textOverflow="ellipsis"
					whiteSpace="nowrap"
					wordBreak="break-word"
					cursor="default"
					userSelect="none"
				>
					{item.name}
				</Text>
			)}
		/>
	);
};
