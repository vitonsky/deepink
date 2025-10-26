import React, { useRef } from 'react';
import { FaTerminal, FaXmark } from 'react-icons/fa6';
import { Button, HStack, Text, VStack } from '@chakra-ui/react';
import { Repl } from '@electric-sql/pglite-repl';
import { wait } from '@utils/tests';

import { useProfileControls } from '..';

const findElement = (
	parentNode: HTMLDivElement,
	selector: string,
	delay = 10,
	maxAttempts = 300,
): Promise<HTMLDivElement> => {
	return new Promise((resolve) => {
		let attempts = 0;

		const interval = setInterval(() => {
			const element = parentNode.querySelector(selector);

			if (element && element instanceof HTMLDivElement) {
				clearInterval(interval);
				resolve(element);
			} else if (attempts++ >= maxAttempts) {
				clearInterval(interval);
				console.warn(
					`Element "${selector}" not found after ${maxAttempts} attempts.`,
				);
			}
		}, delay);
	});
};

export const SQLConsole = ({
	isVisible,
	onVisibilityChange,
}: {
	isVisible: boolean;
	onVisibilityChange: (state: boolean) => void;
}) => {
	const { profile } = useProfileControls();

	const isInitializedRef = useRef<boolean>(false);

	return (
		<VStack
			position="fixed"
			border="1px solid"
			gap="0"
			right=".5rem"
			bottom="2rem"
			borderRadius="4px"
			maxW="80vw"
			maxH="80vh"
			minW="600px"
			borderColor="surface.border"
			display={isVisible ? 'flex' : 'none'}
			overflow="hidden"
			sx={{
				'& .PGliteRepl-root': {
					height: 'auto',
					overflow: 'hidden',

					// eslint-disable-next-line spellcheck/spell-checker
					'& thead': {
						position: 'sticky',
						top: '-1px',
						backgroundColor: '#fff',
					},
				},
				'& .PGliteRepl-table-scroll': {
					overflow: 'auto',
					maxHeight: '50vh',
				},
			}}
		>
			<HStack w="100%" bgColor="surface.panel" padding=".5rem 1rem">
				<HStack w="100%">
					<FaTerminal />
					<Text>Database console</Text>
				</HStack>
				<Button
					onClick={() => onVisibilityChange(false)}
					variant="ghost"
					title="Close popup"
					size="sm"
				>
					<FaXmark />
				</Button>
			</HStack>
			<VStack
				padding="1rem"
				backgroundColor="#fff"
				overflow="hidden"
				w="100%"
				align="100%"
				ref={(node) => {
					// Init Repl with command
					if (!node || isInitializedRef.current) return;

					wait(10).then(async () => {
						const input = await findElement(node, '.cm-content');

						isInitializedRef.current = true;

						input.click();
						await wait(100);
						// eslint-disable-next-line spellcheck/spell-checker
						input.innerHTML = `SELECT * FROM pg_tables WHERE schemaname = 'public'`;

						await wait(100);
						input.dispatchEvent(
							new KeyboardEvent('keydown', {
								key: 'Enter',
								keyCode: 13,
								which: 13,
								code: 'Enter',
								bubbles: true,
							}),
						);
						input.dispatchEvent(
							new KeyboardEvent('keyup', {
								key: 'Enter',
								keyCode: 13,
								which: 13,
								code: 'Enter',
								bubbles: true,
							}),
						);
					});
				}}
			>
				<Repl pg={profile.db.get()} />
			</VStack>
		</VStack>
	);
};
