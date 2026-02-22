// TODO: fix all typos
/* eslint-disable @cspell/spellchecker */
import React, { Fragment, type ReactNode } from 'react';
import {
	Box,
	Flex,
	Grid,
	Heading,
	HStack,
	Image,
	SimpleGrid,
	VStack,
} from '@chakra-ui/react';

import screenshot from './app.png';
import RichLogo from './app.svg?react';
import encryptionScreenshot from './features/encryption.png';
import historyScreenshot from './features/history.png';
import linksScreenshot from './features/links.png';
import remindersScreenshot from './features/reminders.png';
import tagsScreenshot from './features/tags.png';
import workspacesScreenshot from './features/workspaces.png';
import Logo from './icon-simple.svg?react';
import LandingLayout from './LandingLayout';
import { Link, Text } from './StyledComponents';

function getNativeLanguageName(langCode: string) {
	const display = new Intl.DisplayNames([langCode], {
		type: 'language',
	});

	return display.of(langCode);
}

const highlights: {
	title: string;
	content: ReactNode;
}[] = [
	{
		title: 'Bulletproof vault',
		content: (
			<>
				All your data is encrypted. Unlike other apps, it does mean really{' '}
				<b>all your data</b>. You can choose the encryption algorithm you trust.
				Deepink is open source and are opened to a security audits.
			</>
		),
	},
	{
		title: 'Light-speed workflow',
		content:
			'While development we count an actions that is needed to do anything. We minimized these steps for most of actions up to 80% compared to other note taking apps.',
	},
	{
		title: 'All in one',
		content:
			'You create vault with nice password once, move all your notes and write all the things there. Workspaces and nested tags let you organize, isolate and quickly access anything including your daily dairy, private notes for your business strategy, researches, tracking of your sport results, etc.',
	},
];

const features: {
	title: string;
	content: ReactNode;
	image: ImageMetadata;
}[] = [
	{
		title: 'Links',
		content: (
			<>
				<p>
					Copy a link to any note and reference it anywhere else in your vault.
					Build connections between meeting notes and decisions, research and
					conclusions, plans and execution — without repeating the same
					information.
				</p>

				<p>
					Everything stays in sync. Update a note once, and every linked
					reference stays accurate.
				</p>

				<p>
					Deepink also shows where a note is mentioned, so you can trace
					connections and navigate your knowledge naturally.
				</p>

				<p>
					You can also see where a note is mentioned, so you can trace
					connections and navigate related content.
				</p>

				<p>
					Your information shouldn't live in silos. With Links, it becomes a
					network.
				</p>
			</>
		),
		image: linksScreenshot,
	},
	{
		title: 'Workspaces',
		content: (
			<>
				<p>Separate your world — without separating your vault.</p>

				<p>
					Workspaces let you create distinct areas inside a single secure vault.
					Unlock once, then switch between focused environments like Client
					Projects, Personal Journal, Health Tracking, or Learning — without
					overlap.
				</p>

				<p>
					Everything stays organized and context-specific. Share your screen in
					a meeting with confidence, knowing personal or sensitive areas won't
					surface by accident.
				</p>

				<p>One vault. Clear boundaries. Zero friction.</p>
			</>
		),
		image: workspacesScreenshot,
	},
	{
		title: 'History',
		content: (
			<>
				<p>Every note keeps its own timeline.</p>

				<p>
					Deepink automatically saves previous versions, so you can review what
					changed, restore an earlier draft, or track how an idea evolved over
					time. Whether it's yesterday's edit or something from a year ago,
					nothing important is lost.
				</p>

				<p>
					History gives you confidence to refine, rewrite, and rethink — knowing
					every step is preserved and accessible when you need it.
				</p>
			</>
		),
		image: historyScreenshot,
	},
	{
		title: 'Reminders',
		content: (
			<>
				<p>Attach a reminder to any note and get notified when it matters.</p>

				<p>
					Set follow-ups for meeting notes, deadlines for project plans, renewal
					dates for documents, or check-ins for personal goals. The reminder
					stays connected to the exact context — not as a separate task in
					another app.
				</p>

				<p>
					When the time comes, you return directly to the note with all the
					details in place.
				</p>

				<p>Reminders help you act on your information, not just store it.</p>
			</>
		),
		image: remindersScreenshot,
	},
	{
		title: 'Nested tags',
		content: (
			<>
				<p>Structure your notes with tags that follow real hierarchies.</p>

				<p>
					Nested tags let you create parent–child relationships, so broader
					themes can contain more specific subtopics. For example, a parent tag
					like Clients can include individual client tags beneath it, or Finance
					can branch into Taxes, Invoices, and Reports. This keeps high-level
					areas clean while allowing detailed classification underneath.
				</p>

				<p>
					Unlike folders or single-category systems, notes can have multiple
					tags at once. A single note can belong to a specific client, relate to
					a financial topic, and connect to a time period — all without
					duplication.
				</p>

				<p>
					Nested tags give you precise organization with the flexibility to
					reflect how information actually overlaps.
				</p>
			</>
		),
		image: tagsScreenshot,
	},
	{
		title: 'Encryption',
		content: (
			<>
				<p>Your entire vault is encrypted — not just parts of it.</p>

				<p>
					Deepink applies encryption to everything: notes, attached files,
					workspaces, and metadata. Unlike many apps that only encrypt synced
					data or text content, Deepink protects the full structure of your
					vault.
				</p>

				<p>
					Attachments aren't left exposed. Metadata isn't readable. Even file
					sizes are obfuscated to reduce the risk of analysis.
				</p>

				<p>What you store stays private — completely, by design.</p>
			</>
		),
		image: encryptionScreenshot,
	},
];

// TODO: update texts
// TODO: fix styles. Tune colors
// TODO: localize page
// TODO: add download page & json page with data from github releases
// TODO: adopt to make it work on mobile
// TODO: add most important pages
// TODO: update links
// TODO: add analytics

// TODO: tune CEO tags
// TODO: add docs
// TODO: add blog
export default function Hero() {
	const logoElement = (
		<Link href="/" variant="logo">
			<Box as={Logo} display="inline-block" w="1.2em" h="1.2em" />
			<span>Deepink</span>
		</Link>
	);

	const mainNav = (
		<>
			<Link href="/download" variant="nav">
				Download
			</Link>
			<Link href="#features" variant="nav">
				Features
			</Link>
			<Link href="/guides/example/" variant="nav">
				Docs
			</Link>
		</>
	);

	const secondaryNav = (
		<>
			<Link href="#" variant="nav">
				Blog
			</Link>
			<Link href="#" variant="nav">
				Changelog
			</Link>
		</>
	);

	const footer = (
		<>
			<Box maxW="900px" mx="auto" px="1rem">
				<Flex wrap="wrap" w="100%">
					<VStack align="start" gap="1rem">
						<Link href="/" variant="logo">
							<Box as={Logo} display="inline-block" w="1.2em" h="1.2em" />
							<span>Deepink</span>
						</Link>

						<VStack align="start" gap="0.8rem" fontWeight="500">
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
								gap="0.4rem"
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
						<VStack align="start" gap="0.8rem" fontWeight="500">
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
								gap="0.4rem"
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
					{[
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
					].map((language, index) => (
						<Fragment key={language}>
							{index > 0 ? ' | ' : undefined}
							<Link href={`/${language}`}>
								{getNativeLanguageName(language)?.trim()}
							</Link>
						</Fragment>
					))}
				</Flex>
			</Box>
		</>
	);

	return (
		<LandingLayout
			logo={logoElement}
			mainNavigation={mainNav}
			secondaryNavigation={secondaryNav}
			footer={footer}
		>
			{/* Hero Section */}
			<VStack gap="3rem" my="5rem">
				<VStack gap="1.6rem" align="start">
					<Heading
						as="h2"
						fontWeight="500"
						fontSize="42px"
						m={0}
						color="brand.heroHeader"
					>
						Snapshot your thoughts.
					</Heading>
					<Text fontSize="20px" m={0} color="brand.secondary">
						Deepink is a <b>privacy focused</b> note taking app with a light
						speed workflow.
					</Text>
					<HStack gap="0.8rem">
						<Link href="/download" variant="button-primary">
							Download
						</Link>
						<Link href="/download" variant="button-secondary">
							See features
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
					borderColor="brand.border"
				/>
			</VStack>

			{/* Summary Section */}
			<Flex gap="3rem" my="5rem">
				<VStack gap="2rem" maxW="500px" align="start">
					{highlights.map((feature) => (
						<VStack key={feature.title} gap="0.5rem" align="start">
							<Heading as="h3" m={0} fontSize="22px" fontWeight="500">
								{feature.title}
							</Heading>
							<Text m={0} fontSize="18px" color="brand.secondary">
								{feature.content}
							</Text>
						</VStack>
					))}
				</VStack>

				<VStack align="center" fontSize="24px" gap="1.5rem">
					<Box as={RichLogo} maxW="100%" h="auto" transform="rotate(10deg)" />
					<VStack align="center" gap="0.3rem">
						<Text>Free without limits.</Text>
						<Link href="/download" variant="button-primary">
							Download now
						</Link>
					</VStack>
				</VStack>
			</Flex>

			{/* Features Section */}
			<Box maxW="100%" my="10rem">
				<Box mb="3rem">
					<Heading as="h3" fontSize="32px" fontWeight="500" m={0}>
						Your Thinking, Structured
					</Heading>
					<Text fontSize="22px" color="brand.secondary">
						Capture a quick insight or shape something complex — Deepink
						brings order, focus, and structure to every idea.
					</Text>
					<Box as="hr" />
				</Box>

				<SimpleGrid columns={2} gap="2rem" rowGap="3rem">
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
							>
								{feature.content}
							</Text>
							<Box
								overflow="hidden"
								m={0}
								border="3px solid"
								borderColor="brand.border"
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
				<Heading as="h3" fontSize="42px" m={0}>
					Spark ideas
				</Heading>
				<Text maxW="50%" fontSize="22px" m={0}>
					From personal notes to journaling, knowledge bases, and project
					management, Obsidian gives you the tools to come up with ideas and
					organize them.
				</Text>
				<Link href="/download" variant="button-primary">
					Download
				</Link>
			</VStack>
		</LandingLayout>
	);
}
