import React, { forwardRef, ReactNode } from 'react';
import { Box, StackProps, Text, useMultiStyleConfig, VStack } from '@chakra-ui/react';

import { TextSample } from './TextSample';

export const NotePreview = forwardRef<
	HTMLDivElement,
	{
		title: string;
		text: string;
		meta?: ReactNode;
		isSelected?: boolean;
		textToHighlight?: string;
	} & StackProps
>(({ title, text, textToHighlight, meta, isSelected, ...props }, ref) => {
	const styles = useMultiStyleConfig('NotePreview');

	return (
		<VStack
			ref={ref}
			aria-selected={isSelected}
			{...props}
			sx={{
				...styles.root,
				...props.sx,
			}}
		>
			<VStack sx={styles.body}>
				<Text as="h3" sx={styles.title}>
					<TextSample
						text={title}
						highlightText={textToHighlight}
						lengthLimit={30}
					/>
				</Text>

				{text.length > 0 ? (
					<Text sx={styles.text}>
						<TextSample
							text={text}
							highlightText={textToHighlight}
							lengthLimit={150}
						/>
					</Text>
				) : undefined}
			</VStack>

			{meta && <Box sx={styles.meta}>{meta}</Box>}
		</VStack>
	);
});

NotePreview.displayName = 'NotePreview';
