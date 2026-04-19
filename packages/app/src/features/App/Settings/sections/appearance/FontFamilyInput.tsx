import React, { useEffect, useMemo, useState } from 'react';
import { IFontInfo } from 'font-list';
import fuzzysort from 'fuzzysort';
import { BoxProps, InputProps, Text } from '@chakra-ui/react';
import { SimpleComboBox } from '@components/SimpleComboBox';
import { getFontsList } from '@electron/requests/interop/renderer';

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

		return fuzzysort
			.go(value, fonts, {
				key(obj) {
					return obj.name;
				},
				threshold: 0.2,
			})
			.map((result) => result.obj);
	}, [fonts, value]);

	return (
		<SimpleComboBox
			{...props}
			autoFocusItem
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
