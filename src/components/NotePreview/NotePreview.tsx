import React, { forwardRef, ReactNode } from 'react';
import { Box, StackProps, Text, useMultiStyleConfig, VStack } from '@chakra-ui/react';

export const NotePreview = forwardRef<
	HTMLDivElement,
	{
		title: string;
		text: string;
		meta?: ReactNode;
		isSelected?: boolean;
	} & StackProps
>(({ title, text, meta, isSelected, ...props }, ref) => {
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
					{title}
				</Text>

				{text.length > 0 && <Text sx={styles.text}>{text}</Text>}
			</VStack>

			{meta && <Box sx={styles.meta}>{meta}</Box>}
		</VStack>
	);
});
