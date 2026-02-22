import React, { type ReactNode } from 'react';
import { Box, Container, HStack } from '@chakra-ui/react';

interface LandingLayoutProps {
	logo: ReactNode;
	mainNavigation: ReactNode;
	secondaryNavigation: ReactNode;
	children: ReactNode;
	footer: ReactNode;
}

export default function LandingLayout({
	logo,
	mainNavigation,
	secondaryNavigation,
	children,
	footer,
}: LandingLayoutProps) {
	return (
		<Box>
			{/* Header */}
			<Box as="header">
				<Container maxW="900px" px="1rem">
					<HStack gap="1rem" align="center" py="1rem">
						{logo}
						<Box as="nav" aria-label="Main navigation">
							<HStack gap="1px">{mainNavigation}</HStack>
						</Box>
						<Box as="nav" ml="auto">
							<HStack gap="1px">{secondaryNavigation}</HStack>
						</Box>
					</HStack>
				</Container>
			</Box>

			{/* Main Content */}
			<Box as="main">
				<Container maxW="900px">{children}</Container>
			</Box>

			{/* Footer */}
			<Box as="footer" pt="1rem" pb="5rem">
				{footer}
			</Box>
		</Box>
	);
}
