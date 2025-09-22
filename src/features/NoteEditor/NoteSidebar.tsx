import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { FaXmark } from 'react-icons/fa6';
import { Box, Button, HStack, Tab, TabList, Tabs, Text, VStack } from '@chakra-ui/react';

// TODO: let user change size
// TODO: add icons to tabs
export const NoteSidebar = ({
	tabs,
	activeTab,
	onActiveTabChanged,
	onClose,
}: {
	onClose: () => void;
	activeTab: string;
	onActiveTabChanged: (id: string) => void;
	tabs: {
		id: string;
		title: string;
		content: () => ReactNode;
	}[];
}) => {
	// Tabs to render
	const [openedTabs, setOpenedTabs] = useState([activeTab]);
	useEffect(() => {
		setOpenedTabs((openedTabs) =>
			Array.from(
				new Set(
					openedTabs
						.filter((id) => tabs.some((tab) => tab.id === id))
						.concat(activeTab),
				),
			),
		);
	}, [activeTab, tabs]);

	const tabIndex = useMemo(
		() => tabs.findIndex((tab) => activeTab === tab.id),
		[activeTab, tabs],
	);

	return (
		<VStack
			align="start"
			w="100%"
			h="300px"
			maxH="300px"
			minH="300px"
			flex={1}
			gap="1rem"
		>
			<HStack
				w="100%"
				alignItems="start"
				borderBottom="1px solid"
				bgColor="surface.panel"
				borderColor="surface.border"
			>
				<Tabs
					index={tabIndex}
					onChange={(index) => {
						onActiveTabChanged(tabs[index].id);
					}}
					maxH="100px"
					overflow="auto"
					flexShrink={1}
				>
					<TabList display="flex" flexWrap="nowrap" overflow="auto">
						{tabs.map((tab) => {
							return (
								<Tab
									key={tab.id}
									padding="0.4rem 0.7rem"
									border="none"
									fontWeight="600"
									fontSize="14"
									maxW="250px"
									minW="150px"
									whiteSpace="nowrap"
									flex="1 1 auto"
									marginBottom={0}
									title={tab.title}
									onMouseDown={(evt) => {
										const isLeftButton = evt.button === 0;
										if (isLeftButton) return;

										evt.preventDefault();
										evt.stopPropagation();
									}}
								>
									<HStack
										gap=".5rem"
										w="100%"
										justifyContent="space-between"
									>
										<Text
											maxW="180px"
											whiteSpace="nowrap"
											overflow="hidden"
											textOverflow="ellipsis"
										>
											{tab.title}
										</Text>
									</HStack>
								</Tab>
							);
						})}
					</TabList>
				</Tabs>

				<HStack marginLeft="auto" paddingTop=".3rem" paddingInlineEnd=".3rem">
					<Button
						variant="ghost"
						size="xs"
						title="Close panel"
						onClick={onClose}
					>
						<FaXmark />
					</Button>
				</HStack>
			</HStack>

			{tabs.map((tab) => {
				const isActive = tab.id === activeTab;
				const isOpened = isActive || openedTabs.includes(tab.id);

				if (!isOpened) return null;

				return (
					<Box
						key={tab.id}
						w="100%"
						overflow="auto"
						display={isActive ? undefined : 'none'}
					>
						{tab.content()}
					</Box>
				);
			})}
		</VStack>
	);
};
