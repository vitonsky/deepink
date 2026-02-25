import React, { Fragment, type PropsWithChildren, type ReactNode } from 'react';
import { I18nextProvider, useTranslation } from 'react-i18next';
import { IoIosMenu } from 'react-icons/io';
import {
	Box,
	CloseButton,
	Container,
	Drawer,
	Flex,
	Grid,
	HStack,
	IconButton,
	List,
	Portal,
	Separator,
	Stack,
	VStack,
} from '@chakra-ui/react';

import { createI18nInstance } from '../../i18n/createI18nInstance';
import type { i18nPageContext } from '../../i18n/types';
import { CSS_RESET_CLASS_NAME } from '../../theme/constants';

import ChakraProvider from '../ChakraProvider';
import { Link } from '../Link';
import { LocaleContext, useLocalePath } from '../Locale';
import { Text } from '../Text';
import { Logo } from './Logo';

function getNativeLanguageName(langCode: string) {
	const display = new Intl.DisplayNames([langCode], {
		type: 'language',
	});

	return display.of(langCode);
}

type SimpleLink = {
	text: string;
	url: string;
};

export interface LayoutProps {
	children: ReactNode;
	i18n: i18nPageContext;
}

const LayoutContent = ({
	altVersions,
	children,
}: PropsWithChildren<Partial<Pick<i18nPageContext, 'altVersions'>>>) => {
	const localePath = useLocalePath();

	const {
		t,
		i18n: { language },
	} = useTranslation('layout');

	const links = {
		main: [
			{ text: t('nav.download'), url: localePath('/download') },
			{ text: t('nav.features'), url: localePath('/#features') },
			{ text: t('nav.docs'), url: '/guides/example/' },
		],
		additional: [
			{ text: t('nav.blog'), url: '/blog' },
			{ text: t('nav.changelog'), url: '/changelog' },
		],
	} satisfies Record<string, SimpleLink[]>;

	return (
		<>
			{/* Header */}
			<Box as="header" maxW="100%" overflow="auto" position="relative">
				<Container maxW="900px" boxSizing="border-box" px="1rem">
					<HStack gap="1rem" align="center" py="1rem">
						<Link href={localePath('/')} variant="plain">
							<Logo />
						</Link>

						<Drawer.Root size="full">
							<Drawer.Trigger asChild>
								<IconButton
									variant="ghost"
									display={{ base: undefined, md: 'none' }}
									marginInlineStart="auto"
								>
									<Box as={IoIosMenu} boxSize="100%" />
								</IconButton>
							</Drawer.Trigger>
							<Portal>
								<Drawer.Backdrop />
								<Drawer.Positioner>
									<Drawer.Content
										backgroundColor="bg.canvas"
										className={CSS_RESET_CLASS_NAME}
									>
										<Drawer.Header>
											<Drawer.Title>
												<Link
													href={localePath('/')}
													variant="plain"
												>
													<Logo />
												</Link>
											</Drawer.Title>
											<Drawer.CloseTrigger asChild>
												<CloseButton size="xs" display="flex" />
											</Drawer.CloseTrigger>
										</Drawer.Header>
										<Drawer.Body
											fontSize="20px"
											fontWeight="500"
											paddingBlock="1rem"
										>
											<List.Root
												as="ul"
												listStyle="none"
												gap=".5rem"
											>
												{links.main.map((link, index) => (
													<List.Item key={index}>
														<Link href={link.url}>
															{link.text}
														</Link>
													</List.Item>
												))}
											</List.Root>

											<Separator marginBlock="1.5rem" />

											<List.Root
												as="ul"
												listStyle="none"
												gap=".5rem"
											>
												{links.additional.map((link, index) => (
													<List.Item key={index}>
														<Link href={link.url}>
															{link.text}
														</Link>
													</List.Item>
												))}
											</List.Root>
										</Drawer.Body>
									</Drawer.Content>
								</Drawer.Positioner>
							</Portal>
						</Drawer.Root>

						<Box
							as="nav"
							aria-label="Main navigation"
							display={{ base: 'none', md: 'block' }}
						>
							<HStack gap="1px">
								{links.main.map((link, index) => (
									<Link key={index} href={link.url} variant="nav">
										{link.text}
									</Link>
								))}
							</HStack>
						</Box>
						<Box as="nav" ml="auto" display={{ base: 'none', md: 'block' }}>
							<HStack gap="1px">
								{links.additional.map((link, index) => (
									<Link key={index} href={link.url} variant="nav">
										{link.text}
									</Link>
								))}
							</HStack>
						</Box>
					</HStack>
				</Container>
			</Box>

			{/* Main Content */}
			<Box as="main">
				<Container maxW="900px" boxSizing="border-box" px="1rem">
					{children}
				</Container>
			</Box>

			{/* Footer */}
			<Box as="footer" pt="1rem" pb="5rem">
				<Box maxW="900px" boxSizing="border-box" mx="auto" px="1rem">
					<Stack
						wrap="wrap"
						w="100%"
						direction={{ base: 'column-reverse', md: 'row' }}
						gap={{ base: '3rem', md: '1rem' }}
					>
						<VStack align="start" gap="1rem">
							<Link href={localePath('/')} variant="plain">
								<Logo />
							</Link>

							<VStack align="start" gap="0.6rem" fontWeight="500">
								<Text
									fontWeight="500"
									fontSize="1.1rem"
									color="brand.secondary"
								>
									{t('links.followUs.title')}
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
										<Link
											href="https://github.com/vitonsky/deepink"
											target="_blank"
										>
											GitHub
										</Link>
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
							templateColumns={{
								base: 'repeat(auto-fit, minmax(180px, 1fr))',
								md: 'repeat(auto-fit, minmax(150px, 1fr))',
							}}
							gap={{ base: '.5rem', md: '2rem' }}
							flexGrow={1}
							maxW={{ md: '70%' }}
							ml={{ md: 'auto' }}
							width={{ base: '100%', md: 'auto' }}
						>
							<VStack align="start" gap="0.6rem" fontWeight="500">
								<Text
									fontWeight="500"
									fontSize="1.1rem"
									color="brand.secondary"
								>
									{t('links.introduction.title')}
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
										<Link href={localePath('/download')}>
											{t('links.introduction.content.download')}
										</Link>
									</Box>
									<Box as="li">
										<Link href="/docs">
											{t('links.introduction.content.docs')}
										</Link>
									</Box>
									<Box as="li">
										<Link href={localePath('/')}>
											{t('links.introduction.content.overview')}
										</Link>
									</Box>
								</VStack>
							</VStack>

							<VStack align="start" gap="0.8rem" fontWeight="500">
								<Text
									fontWeight="500"
									fontSize="1.1rem"
									color="brand.secondary"
								>
									{t('links.learn.title')}
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
										<Link href="/docs">
											{t('links.learn.content.help')}
										</Link>
									</Box>
									<Box as="li">
										<Link href="/changelog">
											{t('links.learn.content.changelog')}
										</Link>
									</Box>
									<Box as="li">
										<Link href="/about">
											{t('links.learn.content.about')}
										</Link>
									</Box>
									<Box as="li">
										<Link
											href="https://github.com/users/vitonsky/projects/3/views/2"
											target="_blank"
										>
											{t('links.learn.content.roadmap')}
										</Link>
									</Box>
								</VStack>
							</VStack>

							<VStack align="start" gap="0.8rem" fontWeight="500">
								<Text
									fontWeight="500"
									fontSize="1.1rem"
									color="brand.secondary"
								>
									{t('links.resources.title')}
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
										<Link href="/terms">
											{t('links.resources.content.terms')}
										</Link>
									</Box>
									<Box as="li">
										<Link href="/privacy">
											{t('links.resources.content.privacy')}
										</Link>
									</Box>
								</VStack>
							</VStack>
						</Grid>
					</Stack>
				</Box>

				{altVersions && altVersions.length > 0 && (
					<Box
						maxW="900px"
						boxSizing="border-box"
						mx="auto"
						px="1rem"
						mt="3rem"
					>
						<Flex
							wrap="wrap"
							fontSize={{ base: '1.1rem', md: '0.8rem' }}
							py="1rem"
							whiteSpace="pre-wrap"
							justify="center"
						>
							{altVersions.map((version, index) => (
								<Fragment key={version.langCode}>
									{index > 0 ? ' | ' : undefined}
									<Link
										href={version.url}
										fontWeight={
											version.langCode === language
												? 'bold'
												: undefined
										}
									>
										{getNativeLanguageName(version.langCode)?.trim()}
									</Link>
								</Fragment>
							))}
						</Flex>
					</Box>
				)}
			</Box>
		</>
	);
};

export default function Layout({ children, i18n }: LayoutProps) {
	return (
		<ChakraProvider>
			<I18nextProvider
				i18n={createI18nInstance(i18n?.language ?? 'en', i18n?.resources ?? {})}
			>
				<LocaleContext.Provider value={i18n.language}>
					<LayoutContent {...i18n}>{children}</LayoutContent>
				</LocaleContext.Provider>
			</I18nextProvider>
		</ChakraProvider>
	);
}
