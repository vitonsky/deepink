import React, { Fragment, type ReactNode } from 'react';
import { Box, Container, Flex, Grid, HStack, VStack } from '@chakra-ui/react';

import { Logo } from './Logo';
import { Link, Text } from './StyledComponents';

function getNativeLanguageName(langCode: string) {
	const display = new Intl.DisplayNames([langCode], {
		type: 'language',
	});

	return display.of(langCode);
}

const languagesList = [
	'bg',
	'ca',
	'cs',
	'da',
	'de',
	'es',
	'fr',
	'hu',
	'it',
	'ja',
	'ko',
	'nb',
	'pl',
	'pt-br',
	'pt-pt',
	'ru',
	'sl',
	'sv',
	'tr',
	'uk',
	'vi',
	'zh-cn',
	'zh-tw',
];

interface LandingLayoutProps {
	children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
	return (
		<Box>
			{/* Header */}
			<Box as="header">
				<Container maxW="900px" px="1rem">
					<HStack gap="1rem" align="center" py="1rem">
						<Link href="/" variant="plain">
							<Logo />
						</Link>
						<Box as="nav" aria-label="Main navigation">
							<HStack gap="1px">
								<Link href="/download" variant="nav">
									Download
								</Link>
								<Link href="#features" variant="nav">
									Features
								</Link>
								<Link href="/guides/example/" variant="nav">
									Docs
								</Link>
							</HStack>
						</Box>
						<Box as="nav" ml="auto">
							<HStack gap="1px">
								<Link href="#" variant="nav">
									Blog
								</Link>
								<Link href="#" variant="nav">
									Changelog
								</Link>
							</HStack>
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
				<Box maxW="900px" mx="auto" px="1rem">
					<Flex wrap="wrap" w="100%">
						<VStack align="start" gap="1rem">
							<Link href="/" variant="plain">
								<Logo />
							</Link>

							<VStack align="start" gap="0.6rem" fontWeight="500">
								<Text
									fontWeight="500"
									fontSize="1.1rem"
									color="brand.secondary"
								>
									Follow us
								</Text>
								<VStack
									as="ul"
									listStyleType="none"
									m={0}
									p={0}
									gap="0.2rem"
									align="start"
								>
									<Box as="li">
										<Link href="/">GitHub</Link>
									</Box>
									<Box as="li">
										<Link href="/">Mastodon</Link>
									</Box>
									<Box as="li">
										<Link href="/">Bluesky</Link>
									</Box>
								</VStack>
							</VStack>

							<Text as="small" fontWeight="500" color="brand.secondary">
								© {new Date().getFullYear()} Deepink
							</Text>
						</VStack>

						<Grid
							templateColumns="repeat(auto-fit, minmax(100px, 1fr))"
							gap="2rem"
							flexGrow={1}
							maxW="50%"
							ml="auto"
						>
							<VStack align="start" gap="0.6rem" fontWeight="500">
								<Text
									fontWeight="500"
									fontSize="1.1rem"
									color="brand.secondary"
								>
									Get started
								</Text>
								<VStack
									as="ul"
									listStyleType="none"
									m={0}
									p={0}
									gap="0.2rem"
									align="start"
								>
									<Box as="li">
										<Link href="/">Download</Link>
									</Box>
									<Box as="li">
										<Link href="/">Docs</Link>
									</Box>
									<Box as="li">
										<Link href="/">Overview</Link>
									</Box>
								</VStack>
							</VStack>

							<VStack align="start" gap="0.8rem" fontWeight="500">
								<Text
									fontWeight="500"
									fontSize="1.1rem"
									color="brand.secondary"
								>
									Learn
								</Text>
								<VStack
									as="ul"
									listStyleType="none"
									m={0}
									p={0}
									gap="0.4rem"
									align="start"
								>
									<Box as="li">
										<Link href="/">Help</Link>
									</Box>
									<Box as="li">
										<Link href="/">Changelog</Link>
									</Box>
									<Box as="li">
										<Link href="/">About</Link>
									</Box>
									<Box as="li">
										<Link href="/">Roadmap</Link>
									</Box>
								</VStack>
							</VStack>

							<VStack align="start" gap="0.8rem" fontWeight="500">
								<Text
									fontWeight="500"
									fontSize="1.1rem"
									color="brand.secondary"
								>
									Resources
								</Text>
								<VStack
									as="ul"
									listStyleType="none"
									m={0}
									p={0}
									gap="0.4rem"
									align="start"
								>
									<Box as="li">
										<Link href="/">Terms of Use</Link>
									</Box>
									<Box as="li">
										<Link href="/">Privacy Policy</Link>
									</Box>
								</VStack>
							</VStack>
						</Grid>
					</Flex>
				</Box>

				<Box maxW="900px" mx="auto" px="1rem" mt="3rem">
					<Flex
						wrap="wrap"
						fontSize="0.8rem"
						py="1rem"
						whiteSpace="pre-wrap"
						justify="center"
					>
						{languagesList.map((language, index) => (
							<Fragment key={language}>
								{index > 0 ? ' | ' : undefined}
								<Link href={`/${language}`}>
									{getNativeLanguageName(language)?.trim()}
								</Link>
							</Fragment>
						))}
					</Flex>
				</Box>
			</Box>
		</Box>
	);
}
