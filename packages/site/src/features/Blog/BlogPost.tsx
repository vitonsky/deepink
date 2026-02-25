import React, { type PropsWithChildren } from 'react';
import { FaBolt, FaEnvelope, FaLinkedin, FaReddit, FaTwitter } from 'react-icons/fa6';
import { Box, Heading, HStack, VStack } from '@chakra-ui/react';

import { WithLayout } from '../../components/Layout';
import { Link } from '../../components/Link';
import { Text } from '../../components/Text';

import type { BlogPostData } from './types';

export const BlogPost = WithLayout(function Page({
	children,
	meta: {
		data: { title, date },
	},
	url,
}: PropsWithChildren<{
	meta: BlogPostData;
	url: string;
}>) {
	return (
		<VStack
			align="start"
			paddingTop={{ base: '1rem', md: '3rem' }}
			paddingBottom="10rem"
			width="100%"
			maxWidth="700px"
			marginInline="auto"
			gap={0}
		>
			<Heading fontSize="32px" margin={0} marginBottom=".8rem">
				{title}
			</Heading>

			<Text variant="description" width="max-content" marginBottom="1rem">
				{new Intl.DateTimeFormat('en', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
				}).format(new Date(date))}
			</Text>

			<Box width="100%">{children}</Box>

			<HStack width="100%" marginTop="3rem" marginBottom="1rem">
				<Text variant="description" marginInlineEnd=".5rem">
					Share this post
				</Text>
				<Link
					href={`http://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
					title="Share this on Twitter"
					target="_blank"
					display="inline-flex"
				>
					<Box boxSize="1.4rem" as={FaTwitter} />
				</Link>
				<Link
					href={`http://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`}
					title="Share this on Reddit"
					target="_blank"
					display="inline-flex"
				>
					<Box boxSize="1.4rem" as={FaReddit} />
				</Link>
				<Link
					href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=&summary=&source=`}
					title="Share this on LinkedIn"
					target="_blank"
					display="inline-flex"
				>
					<Box boxSize="1.4rem" as={FaLinkedin} />
				</Link>
				<Link
					href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`}
					title="Share this via email"
					display="inline-flex"
				>
					<Box boxSize="1.4rem" as={FaEnvelope} />
				</Link>
			</HStack>

			<Box as="hr" width="100%" />

			<HStack align="center" justify="center" width="100%" marginBlock="3rem">
				<Link href="/blog" marginBottom="1.5rem" fontWeight="500" fontSize="20px">
					<HStack>
						<Box as={FaBolt} boxSize=".8rem" />
						<span>Go to all posts</span>
					</HStack>
				</Link>
			</HStack>
		</VStack>
	);
});
