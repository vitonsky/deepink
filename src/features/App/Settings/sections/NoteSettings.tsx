import React from 'react';
import {
	Divider,
	Input,
	InputGroup,
	InputRightElement,
	Select,
	Switch,
	Text,
} from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';

export const NoteSettings = () => {
	return (
		<Features>
			<FeaturesGroup title="Note creation">
				<FeaturesOption title="New note title">
					<Input size="sm" defaultValue="Note $date$ $time$" />
				</FeaturesOption>
				<FeaturesOption title="Tags for new note">
					<Select size="sm" width="auto">
						<option>Do not set any tags</option>
						<option>Same as selected tag</option>
						<option>Assign tags below</option>
					</Select>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title="Snapshots">
				<FeaturesOption description="When enabled, a snapshots of note content will be created when note is changed. You may control snapshots recording per note level in note history panel.">
					<Switch size="sm" defaultChecked>
						Record note snapshots
					</Switch>
				</FeaturesOption>

				<FeaturesOption
					title="Delay for snapshot"
					description="Time in seconds to wait since recent note changes, before create a new snapshot. The lower time the more snapshots will be created, the large a vault size."
				>
					<InputGroup size="sm" width="auto">
						<Input
							width="8rem"
							textAlign="right"
							type="number"
							min={1}
							max={1000}
							defaultValue={30}
							sx={{
								paddingInlineEnd: '3rem',
							}}
						/>
						<InputRightElement w="3rem" pointerEvents="none">
							<Text variant="secondary">sec</Text>
						</InputRightElement>
					</InputGroup>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title="Trash bin">
				<FeaturesOption description="Ask before deleting a note.">
					<Switch size="sm" defaultChecked>
						Confirm deletion
					</Switch>
				</FeaturesOption>

				<FeaturesOption description="Move notes to a trash bin instead of permanent deletion so you can restore it later.">
					<Switch size="sm" defaultChecked>
						Move notes to bin
					</Switch>
				</FeaturesOption>

				<Divider />

				<FeaturesOption description="Note moved to bin will be permanently deleted after some time.">
					<Switch size="sm">Permanently delete old notes in bin</Switch>
				</FeaturesOption>

				<FeaturesOption
					title="Permanent deletion delay"
					description="Time interval in days to delete note from bin. Time counts from a moment you move note to bin."
				>
					<InputGroup size="sm" width="auto">
						<Input
							width="8rem"
							textAlign="right"
							type="number"
							min={1}
							max={1000}
							defaultValue={30}
							sx={{
								paddingInlineEnd: '3rem',
							}}
						/>
						<InputRightElement w="3rem" pointerEvents="none">
							<Text variant="secondary">days</Text>
						</InputRightElement>
					</InputGroup>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
