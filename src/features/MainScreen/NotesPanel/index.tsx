import React, { useCallback, useEffect, useState } from 'react';
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import { useDebouncedCallback } from 'use-debounce';
import {
	Box,
	Divider,
	HStack,
	Input,
	InputGroup,
	InputLeftElement,
	InputRightElement,
	Tag,
	Text,
	VStack,
} from '@chakra-ui/react';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { NotesList } from '@features/MainScreen/NotesList';
import { useTelemetryTracker } from '@features/telemetry';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveTag,
	selectSearch,
	workspacesApi,
} from '@state/redux/profiles/profiles';

export const NotesPanel = () => {
	const telemetry = useTelemetryTracker();

	const dispatch = useAppDispatch();

	const search = useWorkspaceSelector(selectSearch);
	const activeTag = useWorkspaceSelector(selectActiveTag);

	const workspaceData = useWorkspaceData();
	const setSearch = useCallback(
		(value: string) => {
			dispatch(
				workspacesApi.setSearch({
					...workspaceData,
					search: value,
				}),
			);

			if (value.trim().length > 0) {
				telemetry.track(TELEMETRY_EVENT_NAME.SEARCH_IN_NOTES);
			}
		},
		[dispatch, telemetry, workspaceData],
	);

	const [searchInput, setSearchInput] = useState(search);

	const debouncedSearchUpdate = useDebouncedCallback(setSearch, 300);
	useEffect(() => {
		debouncedSearchUpdate(searchInput);
	}, [debouncedSearchUpdate, searchInput]);

	useEffect(() => {
		debouncedSearchUpdate.cancel();
		setSearchInput(search);
	}, [debouncedSearchUpdate, search]);

	const clearSearch = () => {
		debouncedSearchUpdate.cancel();
		setSearch('');
		setSearchInput('');
	};

	return (
		<VStack
			align="start"
			sx={{
				width: '100%',
				height: '100%',
				flexDirection: 'column',
				gap: '.5rem',
			}}
		>
			<VStack align="start" w="100%" gap="0.5rem">
				<HStack>
					<InputGroup size="sm">
						<InputLeftElement pointerEvents="none">
							<FaMagnifyingGlass />
						</InputLeftElement>
						<Input
							borderRadius="6px"
							placeholder="Search..."
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							onKeyUp={(e) => {
								if (e.key === 'Escape') clearSearch();
							}}
						/>
						{searchInput.length > 0 ? (
							<InputRightElement onClick={clearSearch}>
								<FaXmark />
							</InputRightElement>
						) : undefined}
					</InputGroup>
				</HStack>

				{activeTag && (
					<HStack align="start" gap="0.5rem" maxW="100%">
						<Text
							color="typography.secondary"
							flexShrink={0}
							alignSelf="center"
						>
							Filter by
						</Text>
						<HStack maxW="100%" align="start" overflow="hidden">
							<Tag
								variant="accent"
								as={HStack}
								gap=".5rem"
								align="start"
								title={activeTag.resolvedName}
							>
								<Text
									maxW="100%"
									whiteSpace="nowrap"
									overflow="hidden"
									textOverflow="ellipsis"
									dir="rtl"
								>
									{activeTag.resolvedName}
								</Text>
								<Box
									sx={{
										'&:not(:hover)': {
											opacity: '0.7',
										},
									}}
									onClick={() => {
										dispatch(
											workspacesApi.setSelectedTag({
												...workspaceData,
												tag: null,
											}),
										);
									}}
								>
									<FaXmark />
								</Box>
							</Tag>
						</HStack>
					</HStack>
				)}
			</VStack>

			<Divider />

			<NotesList />
		</VStack>
	);
};
