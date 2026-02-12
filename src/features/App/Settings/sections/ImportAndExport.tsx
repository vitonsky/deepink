import React, { useCallback } from 'react';
import Dropzone from 'react-dropzone';
import {
	Button,
	HStack,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Spinner,
	Text,
	VStack,
} from '@chakra-ui/react';
import { CalmButton } from '@components/CalmButton';
import { useDirectoryPicker } from '@hooks/files/useDirectoryPicker';
import { useFilesPicker } from '@hooks/files/useFilesPicker';
import {
	importOptions,
	ImportTypes,
	useImportNotesPreset,
} from '@hooks/notes/useImportNotesPreset';
import { buildFileName, useNotesExport } from '@hooks/notes/useNotesExport';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/profiles/hooks';
import { selectWorkspace } from '@state/redux/profiles/profiles';

export const ImportAndExport = () => {
	const { importFiles, progress: importProgress } = useImportNotesPreset();
	const notesExport = useNotesExport();

	const selectDirectory = useDirectoryPicker();
	const selectFiles = useFilesPicker();

	const onClickImport = useCallback(
		async (type: ImportTypes) => {
			// NotesImporterOptions
			switch (type) {
				case 'zip': {
					const files = await selectFiles({
						accept: '.zip',
					});
					if (!files || files.length !== 1) return;

					await importFiles('zip', Array.from(files));
					break;
				}
				case 'directory': {
					const files = await selectDirectory();
					if (!files || files.length === 0) return;

					await importFiles('directory', Array.from(files));
					break;
				}
			}
		},
		[importFiles, selectDirectory, selectFiles],
	);

	const currentWorkspace = useWorkspaceData();
	const workspaceData = useAppSelector(selectWorkspace(currentWorkspace));

	return (
		<VStack width="100%" align="start">
			<HStack>
				<Menu size="sm">
					<MenuButton
						size="sm"
						as={CalmButton}
						isDisabled={importProgress !== null}
					>
						Import notes
					</MenuButton>
					<MenuList>
						{importOptions.map((option) => (
							<MenuItem
								key={option.type}
								onClick={() => onClickImport(option.type)}
							>
								<Text>{option.text}</Text>
							</MenuItem>
						))}
					</MenuList>
				</Menu>

				<Button
					size="sm"
					isDisabled={notesExport.progress !== null}
					onClick={async () => {
						await notesExport.exportNotes(
							buildFileName(workspaceData?.name, 'backup'),
						);
					}}
				>
					Export notes
				</Button>
			</HStack>

			<Dropzone
				onDrop={async (files) => {
					if (files.length === 0) return;

					// Import zip file
					if (files.length === 1 && files[0].name.endsWith('.zip')) {
						await importFiles('zip', files);
						return;
					}

					// Import markdown files
					await importFiles('directory', files);
				}}
				disabled={importProgress !== null}
			>
				{({ getRootProps, getInputProps, isDragActive }) => (
					<VStack
						{...getRootProps()}
						width="100%"
						gap="1rem"
						as="section"
						border="1px dashed"
						backgroundColor="dim.50"
						borderColor={isDragActive ? 'accent.500' : 'dim.200'}
						borderWidth="2px"
						borderRadius="6px"
						padding="1rem"
						{...(importProgress === null
							? undefined
							: {
									filter: 'contrast(.3)',
									cursor: 'progress',
									userSelect: 'none',
								})}
					>
						<input {...getInputProps()} />
						<Text>Drop Markdown files or .zip archive to import</Text>
						<Text color="typography.secondary">
							Drag & Drop some files here, or click to select files
						</Text>
					</VStack>
				)}
			</Dropzone>

			{importProgress && (
				<HStack w="100%" align="center">
					<Spinner size="sm" />
					<Text>
						Notes import is in progress. Stage: {importProgress.stage}{' '}
						{importProgress.processed}/{importProgress.total}
					</Text>
				</HStack>
			)}
		</VStack>
	);
};
