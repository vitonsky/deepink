import React from 'react';
import { getAbout } from 'src/about';
import { Box, Link, Text, VStack } from '@chakra-ui/react';

import Logo from '../../../assets/icons/app.svg';

export const About = () => {
	const { displayName, description, version, bugs } = getAbout();

	const versions = (globalThis as any).getEnvVersions() as NodeJS.ProcessVersions;

	return (
		<Box w="100vw" h="100vh" overflow="auto">
			<VStack gap="2rem" maxWidth="600px" margin="auto" padding="2rem">
				<VStack gap="1rem" maxWidth="600px" margin="auto">
					<Box as={Logo} boxSize="200px" />

					<VStack gap=".5rem">
						<Text fontSize="2rem">{displayName}</Text>
						<Text fontSize="1.3rem">{description}</Text>
						<Text fontSize="1rem">Version {version}</Text>
					</VStack>
				</VStack>

				<VStack gap=".5rem" w="100%">
					<Text fontSize="1.2rem">Used libraries</Text>

					<VStack color="typography.secondary" gap="0rem" align="start">
						<Text>electron: {versions.electron}</Text>
						<Text>chrome: {versions.chrome}</Text>
						<Text>node: {versions.node}</Text>
						<Text>v8: {versions.v8}</Text>
					</VStack>
				</VStack>

				<VStack gap=".5rem" w="100%">
					<Text fontSize="1.2rem">Links</Text>
					<Link href={bugs}>Report Bug</Link>
				</VStack>
			</VStack>
		</Box>
	);
};
