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

export const FontFamilyInput = ({
	placeholder,
	inputProps,
	inputValue,
	onInputChange,
	fontSize,
	...props
}: BoxProps & {
	placeholder?: string;
	inputProps?: InputProps;

	inputValue?: string;
	onInputChange?: (inputValue: string) => void;
}) => {
	const listRootRef = useRef<HTMLDivElement>(null);
	const [inputRef, setInputRef] = useState<HTMLDivElement>();

	const [fonts, setFonts] = useState<IFontInfo[]>([]);
	useEffect(() => {
		getFontsList().then(setFonts);
	}, []);

	const fontSuggests = useMemo(() => {
		if (!inputValue) return fonts;

		return fonts.filter(
			(info) => inputValue === null || info.name.includes(inputValue),
		);
	}, [fonts, inputValue]);

	return (
		<Downshift
			onStateChange={({ inputValue }) => {
				if (inputValue !== undefined) {
					onInputChange?.(inputValue ?? '');
				}
			}}
			inputValue={inputValue}
			itemToString={(item: IFontInfo | null) => (item ? item.name : '')}
			itemCount={fontSuggests.length}
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

						{isOpen && fontSuggests.length > 0 && (
							<Popper
								referenceRef={inputRef ?? undefined}
								allowedPlacements={['top', 'bottom']}
								offset={{ mainAxis: 5 }}
								zIndex={999999}
							>
								<VirtualList
									count={fontSuggests.length}
									activeIndex={highlightedIndex ?? undefined}
									getScrollElement={() => listRootRef.current}
									estimateSize={() => 40}
									overscan={10}
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
																	fontSuggests[
																		virtualRow.index
																	];

																return (
																	<ListItem
																		{...getItemProps({
																			key: item.familyName,
																			index: virtualRow.index,
																			item,
																		})}
																		ref={
																			virtualizer.measureElement
																		}
																		key={
																			item.familyName
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
																		<Text
																			maxWidth="100%"
																			padding=".3rem 1rem"
																			fontSize={
																				fontSize
																			}
																			whiteSpace="nowrap"
																			wordBreak="break-word"
																			textOverflow="ellipsis"
																			overflow="hidden"
																			fontFamily={
																				item.familyName
																			}
																		>
																			{item.name}
																		</Text>
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
