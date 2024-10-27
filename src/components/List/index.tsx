import React, { FC, ReactNode } from 'react';
import { HStack, StackProps, useMultiStyleConfig, VStack } from '@chakra-ui/react';

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
	const styles = useMultiStyleConfig('List2');

	return (
		<VStack as="ul" {...props} sx={styles.root}>
			{items.map((item) => {
				const tagId = item.id;
				const isGroupCollapsed = Boolean(item.collapsed);

				return (
					<VStack key={tagId} as="li" __css={styles.item}>
						<HStack
							__css={styles.content}
							aria-selected={activeItem === tagId}
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
							<VStack __css={styles.group}>
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
