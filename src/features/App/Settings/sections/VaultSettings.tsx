import React from 'react';
import { Button, Input, Select, Switch } from '@chakra-ui/react';
import { Features } from '@components/Features/Features';
import { FeaturesGroup } from '@components/Features/Group';
import { FeaturesOption } from '@components/Features/Option/FeaturesOption';

export const VaultSettings = () => {
	return (
		<Features>
			<FeaturesGroup title="Vault settings">
				<FeaturesOption title="Vault name">
					<Input defaultValue="Personal notes" size="sm" />
				</FeaturesOption>

				<FeaturesOption description="Workspaces passwords will be encrypted with master key and saved in database, to automatically open encrypted workspaces with no enter password.">
					<Switch size="sm">Remember workspaces passwords</Switch>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title="Files and data">
				<FeaturesOption title="Images compression">
					<Select size="sm" width="auto">
						<option>Compress images</option>
						<option>Do not compress images</option>
						<option selected>Always ask</option>
					</Select>
				</FeaturesOption>

				<FeaturesOption description="Delete files that is not used anymore.">
					<Switch size="sm">Delete orphaned files</Switch>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title="Encryption">
				<FeaturesOption title="Encryption algorithm">
					<Select defaultValue="aes" size="sm">
						{[
							{
								value: 'none',
								text: 'None',
							},
							{
								value: 'aes',
								text: 'AES',
							},
							{
								value: 'twofish',
								text: 'Twofish',
							},
						].map(({ value, text }) => (
							<option key={value} value={value}>
								{text}
							</option>
						))}
					</Select>
				</FeaturesOption>

				<FeaturesOption title="Password">
					<Button size="sm">Update password</Button>
				</FeaturesOption>
			</FeaturesGroup>

			<FeaturesGroup title="Synchronization">
				<FeaturesOption description="Sync all data in database between your devices, to not loose it. All data are encrypted.">
					<Switch size="sm">Enable synchronization</Switch>
				</FeaturesOption>
				<FeaturesOption title="Synchronization method">
					<Select defaultValue="fs" size="sm">
						{[
							{
								value: 'fs',
								text: 'File system',
							},
							{
								value: 'server',
								text: 'Server',
							},
						].map(({ value, text }) => (
							<option key={value} value={value}>
								{text}
							</option>
						))}
					</Select>
				</FeaturesOption>
				<FeaturesOption title="Synchronization directory">
					<Input
						size="sm"
						placeholder="Enter path on directory"
						defaultValue="/foo/bar"
						disabled
					/>
				</FeaturesOption>
			</FeaturesGroup>
		</Features>
	);
};
