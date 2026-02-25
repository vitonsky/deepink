import React from 'react';
import { FaArrowRight } from 'react-icons/fa6';
import { Box, Heading, HStack, Image, Stack, VStack } from '@chakra-ui/react';

import { WithLayout } from '../../components/Layout';
import { Link } from '../../components/Link';
import { Text } from '../../components/Text';

import type { BlogPostData } from './types';

export default WithLayout(function Page({ posts }: { posts: BlogPostData[] }) {
	return (
		<VStack
			align="start"
			paddingBottom="10rem"
			gap={{ base: '3rem', md: '5rem' }}
			width="100%"
		>
			<VStack align="start" width="100%" paddingLeft={{ md: '200px' }}>
				<Heading fontSize="38px" marginBottom="1rem">
					Blog posts
				</Heading>
				<Text variant="description" fontSize="22px">
					What's new with Deepink?
				</Text>
			</VStack>

			<VStack
				gap="2rem"
				align="start"
				width="100%"
				separator={<Box as="hr" width="100%" />}
			>
				{posts.map(({ slug, data: { title, description, image, date } }) => {
					const postUrl = `/blog/${slug}`;

					return (
						<Stack
							key={slug}
							align="start"
							width="100%"
							boxSizing="border-box"
							gap={{ base: '.5rem', md: '0' }}
							flexDirection={{ base: 'column-reverse', md: 'row' }}
						>
							<VStack
								paddingRight={{ md: '3rem' }}
								width={{ md: '200px' }}
								align="start"
								flexShrink={0}
								boxSizing="border-box"
							>
								<Text variant="description" width="max-content">
									{new Intl.DateTimeFormat('en', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									}).format(new Date(date))}
								</Text>
							</VStack>
							<VStack align="start">
								{image && (
									<Link
										href={postUrl}
										variant="plain"
										display="inline-flex"
										marginBottom="1.5rem"
										borderRadius="12px"
										overflow="hidden"
										border="1px solid #00000017"
									>
										<Image
											src={image.src}
											width="100%"
											height="auto"
											aspectRatio={`${image.width}/${image.height}`}
										/>
									</Link>
								)}
								<Heading
									as="h2"
									margin={0}
									fontSize="28px"
									marginBottom=".8rem"
								>
									<Link href={postUrl} variant="header">
										{title}
									</Link>
								</Heading>
								<Text whiteSpace="pre-wrap">{description}</Text>

								<Link
									href={postUrl}
									marginTop=".5rem"
									display={{ base: 'none', md: 'inline-block' }}
								>
									<HStack>
										<span>Read more</span>
										<Box as={FaArrowRight} boxSize=".8rem" />
									</HStack>
								</Link>
							</VStack>
						</Stack>
					);
				})}
			</VStack>
		</VStack>
	);
});
