import React, { useCallback, useEffect, useState } from 'react';
import { FaArrowDownWideShort, FaMagnifyingGlass, FaXmark } from 'react-icons/fa6';
import { useDebouncedCallback } from 'use-debounce';
import {
	Button,
	HStack,
	Input,
	InputGroup,
	InputLeftElement,
	InputRightElement,
	Tag,
	Text,
	VStack,
} from '@chakra-ui/react';
import { NotesList } from '@features/MainScreen/NotesList';
import { useAppDispatch } from '@state/redux/hooks';
import { useWorkspaceData, useWorkspaceSelector } from '@state/redux/profiles/hooks';
import {
	selectActiveTag,
	selectSearch,
	workspacesApi,
} from '@state/redux/profiles/profiles';

export const NotesPanel = () => {
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
		},
		[dispatch, workspaceData],
	);

	const [searchInput, setSearchInput] = useState(search);

	const debouncedSearchUpdate = useDebouncedCallback(setSearch, 600);
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
				gap: '1rem',
			}}
		>
			<VStack align="start" w="100%" gap="0.8rem">
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

					<Button variant="primary" size="sm" paddingInline=".5rem">
						<FaArrowDownWideShort />
					</Button>
				</HStack>

				{activeTag && (
					<HStack maxW="100%" paddingInline=".3rem">
						<Text minW="fit-content">With tag</Text>
						<Tag variant="accent">
							<Text
								maxW="100%"
								whiteSpace="nowrap"
								overflow="hidden"
								textOverflow="ellipsis"
								dir="rtl"
							>
								{activeTag.resolvedName}
							</Text>
						</Tag>
					</HStack>
				)}
			</VStack>

			<NotesList />
		</VStack>
	);
};
