import React, { Fragment, type ReactNode } from 'react';
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

import LandingLayout from '../../components/Layout/Layout';
import { Link } from '../../components/Link';
import { Text } from '../../components/Text';

import screenshot from './app.png';
import RichLogo from './app.svg?react';
import encryptionScreenshot from './features/encryption.png';
import historyScreenshot from './features/history.png';
import linksScreenshot from './features/links.png';
import remindersScreenshot from './features/reminders.png';
import tagsScreenshot from './features/tags.png';
import workspacesScreenshot from './features/workspaces.png';

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

// TODO: add download page & json page with data from github releases
// TODO: add most important pages
// TODO: update links
// TODO: localize page

// TODO: add analytics
// TODO: tune CEO tags
// TODO: add docs
// TODO: add blog
export default function Landing() {
	return (
		<LandingLayout>
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
						Snapshot your thoughts.
					</Heading>
					<Text fontSize="22px" m={0} color="brand.secondary">
						Deepink is a <b>privacy focused</b> note taking app with a light
						speed workflow.
					</Text>
					<HStack gap="0.8rem">
						<Link href="/download" variant="button-primary">
							Get Deepink
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
					borderColor="border.contrast"
				/>
			</VStack>

			{/* Summary Section */}
			<Stack
				gap="3rem"
				my="5rem"
				direction={{ base: 'column', md: 'row' }}
				separator={<Separator />}
			>
				<VStack gap="2rem" maxW={{ md: '500px' }} align="start">
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

				<VStack
					align="center"
					fontSize="24px"
					gap="1.5rem"
					minW={{ md: '200px' }}
				>
					<Box
						as={RichLogo}
						maxW="100%"
						width={{ base: '350px', md: '100%' }}
						h="auto"
						transform="rotate(10deg) scale(.9)"
					/>
					<VStack align="center" gap="0.5rem" width="100%">
						<Text>Free without limits.</Text>
						<Link
							href="/download"
							variant="button-primary"
							width="100%"
							maxW={{ base: '250px', md: '100%' }}
							textAlign="center"
						>
							Download now
						</Link>
					</VStack>
				</VStack>
			</Stack>

			{/* Features Section */}
			<Box maxW="100%" my="10rem">
				<VStack mb="3rem" align="start" gap="1rem" w="100%">
					<Heading as="h3" fontSize="32px" fontWeight="500" m={0}>
						Your Thinking, Structured
					</Heading>
					<Text fontSize="22px" color="brand.secondary">
						Capture a quick insight or shape something complex - Deepink
						brings order, focus, and structure to every idea.
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
					Notes for the mood you’re in
				</Heading>
				<Text
					maxW={{ base: undefined, md: '60%' }}
					fontSize="22px"
					textAlign="center"
					m={0}
				>
					One space for everyday life, another for books, another for plans.
					Switch contexts in a click, keep things clean, and keep writing
					without overthinking where it should go.
				</Text>
				<Link href="/download" variant="button-primary">
					Get Deepink
				</Link>
			</VStack>
		</LandingLayout>
	);
}
