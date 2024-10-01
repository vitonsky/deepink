import React, { FC } from 'react';
import { Button, HStack, StackProps, Text } from '@chakra-ui/react';
import { useStatusBar } from '@features/MainScreen/StatusBar/StatusBarProvider';

export type StatusBarProps = StackProps;

// TODO: make status bar extensible
export const StatusBar: FC<StatusBarProps> = (props) => {
	const { start, end } = useStatusBar();

	return (
		<HStack
			minW="100%"
			fontSize=".9em"
			bgColor="surface"
			borderTop="1px solid #e2e8f0"
			{...props}
		>
			<HStack w="auto">
				{start.map((item, idx) =>
					item.visible ? (
						<Button
							key={idx}
							size="xs"
							variant="ghost"
							borderRadius="0"
							title={item.title}
							onClick={item.onClick}
						>
							<HStack>
								{item.icon}
								{item.text && <Text>{item.text}</Text>}
							</HStack>
						</Button>
					) : undefined,
				)}
			</HStack>

			<HStack w="auto" marginLeft="auto">
				{end.map((item, idx) =>
					item.visible ? (
						<Button
							key={idx}
							size="xs"
							variant="ghost"
							borderRadius="0"
							title={item.title}
							onClick={item.onClick}
						>
							<HStack>
								{item.icon}
								{item.text && <Text>{item.text}</Text>}
							</HStack>
						</Button>
					) : undefined,
				)}
			</HStack>
		</HStack>
	);
};
