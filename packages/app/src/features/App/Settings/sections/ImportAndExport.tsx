import React, { useCallback } from 'react';
import Dropzone from 'react-dropzone';
import { useTranslation } from 'react-i18next';
import { LOCALE_NAMESPACE } from 'src/i18n';
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
import { ImportTypes, useImportNotesPreset } from '@hooks/notes/useImportNotesPreset';
import { buildFileName, useNotesExport } from '@hooks/notes/useNotesExport';
import { useAppSelector } from '@state/redux/hooks';
import { useWorkspaceData } from '@state/redux/vaults/hooks';
import { selectWorkspace } from '@state/redux/vaults/vaults';

export const ImportAndExport = () => {
	const { t } = useTranslation(LOCALE_NAMESPACE.settings);
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

	const importOptions = [
		{ type: 'zip' as const, text: t('importExport.importFromZip') },
		{ type: 'directory' as const, text: t('importExport.importFromDirectory') },
	];

	return (
		<VStack width="100%" align="start">
			<HStack>
				<Menu size="sm">
					<MenuButton
						size="sm"
						as={CalmButton}
						isDisabled={importProgress !== null}
					>
						{t('importExport.importNotes')}
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
					{t('importExport.exportNotes')}
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
						<Text>{t('importExport.dropzone.title')}</Text>
						<Text color="typography.secondary">
							{t('importExport.dropzone.description')}
						</Text>
					</VStack>
				)}
			</Dropzone>

			{importProgress && (
				<HStack w="100%" align="center">
					<Spinner size="sm" />
					<Text>
						{t('importExport.progress', {
							stage: importProgress.stage,
							processed: importProgress.processed,
							total: importProgress.total,
						})}
					</Text>
				</HStack>
			)}
		</VStack>
	);
};
