import React, { FC, ReactNode } from 'react';
import { HStack, StackProps, VStack } from '@chakra-ui/react';

export type ListItem = {
	id: string;
	content: ReactNode;
	childrens?: ListItem[];
	collapsed?: boolean;
};

export type IListProps = StackProps & {
	items: ListItem[];
	activeItem?: string;
	onPick?: (id: string) => void;
};

export const List: FC<IListProps> = ({ items, activeItem, onPick, ...props }) => {
	return (
		<VStack
			as="ul"
			w="100%"
			gap="0"
			{...props}
			sx={{
				margin: '0',
				paddingLeft: '0',
				listStyle: 'none',
				// eslint-disable-next-line spellcheck/spell-checker
				fontFamily: 'Arial, Helvetica, sans-serif',
				userSelect: 'none',
				'& &': {
					paddingStart: '.5rem',
				},
				...props.sx,
			}}
		>
			{items.map((item) => {
				const tagId = item.id;
				const isGroupCollapsed = Boolean(item.collapsed);

				return (
					<VStack w="100%" key={tagId} as="li" lineHeight="1.5rem" gap="0">
						<HStack
							w="100%"
							sx={{
								...(activeItem === tagId
									? {
											backgroundColor: '#e8e6ff',
											color: '#6b00cb',
									  }
									: {
											'&:hover': {
												backgroundColor:
													'var(--color-control-type-list-fill-color-hover)',
												color: 'var(--color-control-type-list-typo-base)',
											},
									  }),
							}}
							onClick={(evt) => {
								if (onPick) {
									evt.stopPropagation();
									onPick(tagId);
								}
							}}
						>
							{item.content}
						</HStack>

						{item.childrens && !isGroupCollapsed && (
							<VStack w="100%" paddingStart=".5rem">
								<List
									items={item.childrens}
									activeItem={activeItem}
									onPick={onPick}
								/>
							</VStack>
						)}
					</VStack>
				);
			})}
		</VStack>
	);
};
