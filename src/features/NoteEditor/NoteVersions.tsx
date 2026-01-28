import React, { useCallback, useEffect, useState } from 'react';
import { FaCheck, FaEraser, FaFloppyDisk, FaGlasses, FaTrashCan } from 'react-icons/fa6';
import { WorkspaceEvents } from '@api/events/workspace';
import { Box, Button, HStack, Switch, Text, VStack } from '@chakra-ui/react';
import { BoxWithCenteredContent } from '@components/BoxWithCenteredContent';
import { TextWithIcon } from '@components/TextWithIcon';
import { NoteVersion } from '@core/features/notes/history/NoteVersions';
import { TELEMETRY_EVENT_NAME } from '@core/features/telemetry';
import { useEventBus, useNotesHistory } from '@features/App/Workspace/WorkspaceProvider';
import { useTelemetryTracker } from '@features/telemetry';
import { useConfirmDialog } from '@hooks/useConfirmDialog';

const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
const timestampToDays = (ms: number) => Math.floor(ms / ONE_DAY_IN_MS);
const getTimestampAgeInDays = (ms: number) => timestampToDays(Date.now() - ms);

export const formatNoteVersionPreview = (version: NoteVersion) =>
	`${new Date(version.createdAt).toLocaleString()} (${version.text.length} chars)`;

// TODO: implement lazy loading
export const NoteVersions = ({
	noteId,
	onSnapshot,
	onDeleteAll,
	onVersionApply,
	onShowVersion,
	recordControl,
	isReadOnly,
}: {
	noteId: string;
	onSnapshot: () => void;
	onDeleteAll: () => void;
	onVersionApply: (version: NoteVersion) => void;
	onShowVersion: (version: NoteVersion) => void;
	recordControl: {
		isDisabled: boolean;
		onChange: (isDisabled: boolean) => void;
	};
	isReadOnly?: boolean;
}) => {
	const telemetry = useTelemetryTracker();
	const noteHistory = useNotesHistory();

	const [versions, setVersions] = useState<NoteVersion[] | null>(null);
	const updateVersionsList = useCallback(
		() => noteHistory.getList(noteId).then(setVersions),
		[noteHistory, noteId],
	);

	useEffect(() => {
		setVersions(null);
		updateVersionsList();
	}, [noteId, updateVersionsList]);

	// Refresh note versions by event
	const eventBus = useEventBus();
	useEffect(() => {
		return eventBus.listen(WorkspaceEvents.NOTE_HISTORY_UPDATED, (noteId) => {
			if (noteId !== noteId) return;
			updateVersionsList();
		});
	}, [eventBus, updateVersionsList]);

	const confirm = useConfirmDialog();

	return (
		<VStack w="100%" maxH="100%">
			<HStack w="100%">
				<Button
					size="sm"
					title="Save the current state of this note as a new version in history"
					onClick={onSnapshot}
				>
					<TextWithIcon icon={<FaFloppyDisk />}>Save version</TextWithIcon>
				</Button>
				<Button
					size="sm"
					title="Remove all saved versions of this note permanently"
					onClick={(evt) => {
						if (evt.ctrlKey || evt.metaKey) {
							onDeleteAll();
						} else {
							confirm(({ onClose }) => ({
								title: 'Delete all note versions',
								content: (
									<Box>
										<Text>
											This action will permanently delete all note
											versions.
										</Text>
										<Text>Are you sure about it?</Text>
									</Box>
								),
								action: (
									<>
										<Button
											variant="accent"
											onClick={() => {
												onDeleteAll();
												onClose();
											}}
										>
											Apply
										</Button>
										<Button onClick={onClose}>Cancel</Button>
									</>
								),
							}));
						}
					}}
				>
					<TextWithIcon icon={<FaEraser />}>Delete all</TextWithIcon>
				</Button>

				<HStack as="label">
					<Switch
						size="sm"
						isChecked={recordControl.isDisabled}
						onChange={(event) => recordControl.onChange(event.target.checked)}
					/>{' '}
					<Text>Don't record changes for this note</Text>
				</HStack>
			</HStack>

			<Box w="100%" overflow="auto" display="flex" flex={1} flexFlow="column">
				{versions && versions.length === 0 && (
					<BoxWithCenteredContent>
						<Text fontSize="1.3rem">This note have no recorded versions</Text>
					</BoxWithCenteredContent>
				)}
				{versions === null && (
					<BoxWithCenteredContent>
						<Text fontSize="1.3rem">Loading...</Text>
					</BoxWithCenteredContent>
				)}
				{versions !== null && versions.length > 0 && (
					<VStack w="100%" gap={0}>
						{versions.map((version) => (
							<HStack
								key={version.id}
								w="100%"
								align="start"
								padding="0.3rem"
								alignItems="center"
								_hover={{ backgroundColor: 'dim.50' }}
							>
								<HStack>
									<Text>
										{new Date(version.createdAt).toLocaleString()}
									</Text>
									<Text color="typography.secondary">
										{version.text.length} chars
									</Text>
								</HStack>
								<HStack marginLeft="auto">
									<Button
										isDisabled={Boolean(isReadOnly)}
										size="sm"
										title={
											isReadOnly
												? 'Version cannot be applied for a read-only note'
												: 'Apply version'
										}
										onClick={(evt) => {
											const applyVersion = () => {
												onVersionApply(version);
												telemetry.track(
													TELEMETRY_EVENT_NAME.NOTE_VERSION_APPLIED,
													{
														versionAgeInDays:
															getTimestampAgeInDays(
																version.createdAt,
															),
													},
												);
											};

											// Apply immediately
											if (evt.ctrlKey || evt.metaKey) {
												applyVersion();
												return;
											}

											confirm(({ onClose }) => ({
												title: 'Apply note version',
												content: (
													<VStack gap="1rem" align="start">
														<Text>
															You are about to apply note
															version{' '}
															<Text
																as="span"
																color="typography.secondary"
															>
																{formatNoteVersionPreview(
																	version,
																)}
															</Text>
															.
														</Text>
														<Text>
															This action will replace
															current note data with text of
															a selected snapshot. Are you
															sure?
														</Text>
													</VStack>
												),
												action: (
													<>
														<Button
															variant="accent"
															onClick={() => {
																applyVersion();
																onClose();
															}}
														>
															Apply
														</Button>
														<Button
															variant="accent"
															onClick={() => {
																onShowVersion(version);
																onClose();
															}}
														>
															Preview
														</Button>
														<Button onClick={onClose}>
															Cancel
														</Button>
													</>
												),
											}));
										}}
									>
										<FaCheck />
									</Button>

									<Button
										size="sm"
										title="Open version"
										onClick={() => {
											onShowVersion(version);

											telemetry.track(
												TELEMETRY_EVENT_NAME.NOTE_VERSION_VIEWED,
												{
													versionAgeInDays:
														getTimestampAgeInDays(
															version.createdAt,
														),
												},
											);
										}}
									>
										<FaGlasses />
									</Button>
									<Button
										size="sm"
										title="Delete version"
										onClick={(evt) => {
											const deleteVersion = async () => {
												await noteHistory.delete([version.id]);
												eventBus.emit(
													WorkspaceEvents.NOTE_HISTORY_UPDATED,
													noteId,
												);

												telemetry.track(
													TELEMETRY_EVENT_NAME.NOTE_VERSION_DELETED,
													{
														versionAgeInDays:
															getTimestampAgeInDays(
																version.createdAt,
															),
													},
												);
											};

											// Delete immediately
											if (evt.ctrlKey || evt.metaKey) {
												deleteVersion();
												return;
											}

											confirm(({ onClose }) => ({
												title: 'Delete note version',
												content: (
													<VStack gap="1rem" align="start">
														<Text>
															You are about to delete note
															version{' '}
															<Text
																as="span"
																color="typography.secondary"
															>
																{formatNoteVersionPreview(
																	version,
																)}
															</Text>
															.
														</Text>
														<Text>
															This action will delete note
															version irreversibly. Are you
															sure?
														</Text>
													</VStack>
												),
												action: (
													<>
														<Button
															variant="accent"
															onClick={() => {
																deleteVersion();
																onClose();
															}}
														>
															Delete
														</Button>
														<Button
															variant="accent"
															onClick={() => {
																onShowVersion(version);
																onClose();
															}}
														>
															Preview
														</Button>
														<Button onClick={onClose}>
															Cancel
														</Button>
													</>
												),
											}));
										}}
									>
										<FaTrashCan />
									</Button>
								</HStack>
							</HStack>
						))}
					</VStack>
				)}
			</Box>
		</VStack>
	);
};
