import React, { type ReactNode } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
	Box,
	Heading,
	HStack,
	Image,
	Separator,
	SimpleGrid,
	Stack,
	VStack,
} from '@chakra-ui/react';

import { WithLayout } from '../../components/Layout';
import { Link } from '../../components/Link';
import { useLocalePath } from '../../components/Locale';
import { Text } from '../../components/Text';
import { TheRock } from '../../components/TheRock';

import screenshot from './screenshots/app.png';
import encryptionScreenshot from './screenshots/encryption.png';
import historyScreenshot from './screenshots/history.png';
import linksScreenshot from './screenshots/links.png';
import remindersScreenshot from './screenshots/reminders.png';
import tagsScreenshot from './screenshots/tags.png';
import workspacesScreenshot from './screenshots/workspaces.png';

// TODO: proofread the blog posts
// TODO: add most important pages - privacy, terms

// TODO: add analytics
// TODO: add docs
export default WithLayout(() => {
	const localePath = useLocalePath();

	const { t } = useTranslation('landing');
	const highlights: {
		title: string;
		content: ReactNode;
	}[] = [
		{
			title: t('highlights.content.encryption.title'),
			content: (
				<Trans
					t={t}
					i18nKey="highlights.content.encryption.text"
					components={[
						<b key={1} />,
						<Link
							key={2}
							href="https://github.com/vitonsky/deepink"
							target="_blank"
						/>,
					]}
				/>
			),
		},
		{
			title: t('highlights.content.workflow.title'),
			content: (
				<Trans
					t={t}
					i18nKey="highlights.content.workflow.text"
					components={[<Link key={1} href="/blog/the-workflow-cost" />]}
				/>
			),
		},
		{
			title: t('highlights.content.universality.title'),
			content: t('highlights.content.universality.text'),
		},
	];

	const features: {
		title: string;
		content: ReactNode;
		image: ImageMetadata;
	}[] = [
		{
			title: t('features.content.links.title'),
			content: <Trans t={t} i18nKey="features.content.links.text" />,
			image: linksScreenshot,
		},
		{
			title: t('features.content.workspaces.title'),
			content: <Trans t={t} i18nKey="features.content.workspaces.text" />,
			image: workspacesScreenshot,
		},
		{
			title: t('features.content.history.title'),
			content: <Trans t={t} i18nKey="features.content.history.text" />,
			image: historyScreenshot,
		},
		{
			title: t('features.content.reminders.title'),
			content: <Trans t={t} i18nKey="features.content.reminders.text" />,
			image: remindersScreenshot,
		},
		{
			title: t('features.content.tags.title'),
			content: <Trans t={t} i18nKey="features.content.tags.text" />,
			image: tagsScreenshot,
		},
		{
			title: t('features.content.encryption.title'),
			content: <Trans t={t} i18nKey="features.content.encryption.text" />,
			image: encryptionScreenshot,
		},
	];

	return (
		<>
			{/* Hero Section */}
			<VStack gap="3rem" my="5rem" align="start">
				<VStack gap="1.6rem" align="start">
					<Heading
						as="h2"
						m={0}
						fontWeight="500"
						fontSize="42px"
						lineHeight="1.1"
						color="brand.heroHeader"
					>
						{t('hero.title')}
					</Heading>
					<Text fontSize="22px" m={0} color="brand.secondary" maxWidth="600px">
						<Trans
							t={t}
							i18nKey="hero.subtitle"
							components={[<b key={0} />]}
						/>
					</Text>
					<HStack gap="0.8rem">
						<Link href={localePath('/download')} variant="button-primary">
							{t('hero.button.get')}
						</Link>
						<Link href={localePath('/#features')} variant="button-secondary">
							{t('hero.button.features')}
						</Link>
					</HStack>
				</VStack>
				<Image
					src={screenshot.src}
					style={{
						aspectRatio: `${screenshot.width}/${screenshot.height}`,
					}}
					borderRadius="18px"
					border="3px solid"
					borderColor="border.contrast"
				/>
			</VStack>

			{/* Summary Section */}
			<Stack gap="2rem" my="5rem" direction={{ base: 'column', md: 'row' }}>
				<VStack gap="2rem" maxW={{ md: '550px' }} align="start">
					{highlights.map((feature) => (
						<VStack key={feature.title} gap="0.5rem" align="start">
							<Heading as="h3" m={0} fontSize="22px" fontWeight="500">
								{feature.title}
							</Heading>
							<Text
								m={0}
								fontSize="18px"
								color="brand.secondary"
								whiteSpace="pre-line"
							>
								{feature.content}
							</Text>
						</VStack>
					))}
				</VStack>

				<VStack
					align="center"
					fontSize="24px"
					gap="2rem"
					minW={{ md: '200px' }}
					marginInlineStart={{ md: 'auto' }}
				>
					<TheRock maxW="300px" width={{ base: '350px', md: '100%' }} />

					<VStack align="center" gap="0.5rem" width="100%">
						<Link
							href={localePath('/download')}
							variant="button-primary"
							width="100%"
							maxW={{ base: '250px', md: '100%' }}
							textAlign="center"
						>
							{t('highlights.cta.button')}
						</Link>
						<Text textAlign="center">{t('highlights.cta.text')}</Text>
					</VStack>
				</VStack>
			</Stack>

			{/* Features Section */}
			<Box maxW="100%" my="10rem">
				<VStack
					mb="3rem"
					align="start"
					gap="1rem"
					w="100%"
					id="features"
					scrollMarginBlock="3rem"
				>
					<Heading as="h3" fontSize="32px" fontWeight="500" m={0}>
						{t('features.intro.title')}
					</Heading>
					<Text fontSize="22px" color="brand.secondary">
						{t('features.intro.text')}
					</Text>
					<Separator width="100%" />
				</VStack>

				<SimpleGrid columns={{ base: 1, md: 2 }} gap="2rem" rowGap="3rem">
					{features.map((feature) => (
						<VStack key={feature.title} gap="0.5rem" align="start">
							<Heading
								as="h3"
								m={0}
								fontSize="22px"
								fontWeight="500"
								mb="0.3rem"
							>
								{feature.title}
							</Heading>
							<Text
								m={0}
								fontSize="18px"
								mb="0.5rem"
								color="brand.secondary"
								as="div"
								display="flex"
								flexDirection="column"
								gap="1rem"
								whiteSpace="pre-line"
							>
								{feature.content}
							</Text>
							<Box
								overflow="hidden"
								m={0}
								border="3px solid"
								borderColor="border.contrast"
								borderRadius="14px"
								maxH="300px"
							>
								<Image
									src={feature.image.src}
									style={{
										aspectRatio: `${feature.image.width}/${feature.image.height}`,
									}}
									objectFit="contain"
									minW="100%"
								/>
							</Box>
						</VStack>
					))}
				</SimpleGrid>
			</Box>

			{/* CTA Section */}
			<VStack
				minH="100vh"
				align="center"
				justify="start"
				gap="2rem"
				pt="15%"
				boxSizing="border-box"
			>
				<Heading
					as="h3"
					m={0}
					fontSize="42px"
					lineHeight="1.1"
					textAlign={{ base: 'center', md: 'start' }}
				>
					{t('cta.title')}
				</Heading>
				<Text
					maxW={{ base: undefined, md: '60%' }}
					fontSize="22px"
					textAlign="center"
					m={0}
				>
					{t('cta.text')}
				</Text>
				<Link href={localePath('/download')} variant="button-primary">
					{t('cta.button')}
				</Link>
			</VStack>
		</>
	);
});
