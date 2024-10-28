import React, { FC, ReactNode } from 'react';
import { HStack, StackProps, useMultiStyleConfig, VStack } from '@chakra-ui/react';

export type ListItem = {
	id: string;
	content: ReactNode;
	childrens?: ListItem[];
	collapsed?: boolean;
};

export type INestedListProps = StackProps & {
	items: ListItem[];
	activeItem?: string;
	onPick?: (id: string) => void;
};

export const NestedList: FC<INestedListProps> = ({
	items,
	activeItem,
	onPick,
	...props
}) => {
	const styles = useMultiStyleConfig('NestedList');

	return (
		<VStack
			as="ul"
			{...props}
			sx={{
				...styles.root,
				...props.sx,
			}}
		>
			{items.map((item) => {
				const itemId = item.id;
				const isGroupCollapsed = Boolean(item.collapsed);

				return (
					<VStack key={itemId} as="li" sx={styles.item}>
						<HStack
							sx={styles.content}
							aria-selected={activeItem === itemId}
							onClick={(evt) => {
								if (onPick) {
									evt.stopPropagation();
									onPick(itemId);
								}
							}}
						>
							{item.content}
						</HStack>

						{item.childrens && !isGroupCollapsed && (
							<VStack sx={styles.group}>
								<NestedList
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
