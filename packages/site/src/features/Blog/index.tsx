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
			paddingTop={{ md: '2rem' }}
			paddingBottom={{ base: '5rem', md: '10rem' }}
			gap={{ base: '3rem', md: '5rem' }}
			width="100%"
		>
			<VStack align="start" width="100%" paddingLeft={{ md: '200px' }} gap="1rem">
				<Heading fontSize="3rem" lineHeight="3.8rem" margin={0}>
					Blog posts
				</Heading>
				<Text variant="description" fontSize={{ base: '1.6rem', md: '2rem' }}>
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
								<Text
									variant="description"
									width="max-content"
									fontSize="1.2rem"
									suppressHydrationWarning
								>
									{new Intl.DateTimeFormat('en', {
										year: 'numeric',
										month: 'long',
										day: 'numeric',
									}).format(date)}
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
									marginBottom=".8rem"
									css={{
										base: {
											fontSize: '1.8rem',
											lineHeight: '2.2rem',
										},
										md: {
											fontSize: '2.4rem',
											lineHeight: '2.8rem',
										},
									}}
								>
									<Link href={postUrl} variant="header">
										{title}
									</Link>
								</Heading>
								<Text
									whiteSpace="pre-wrap"
									fontSize="1.2rem"
									lineHeight="1.8rem"
								>
									{description}
								</Text>

								<Link
									href={postUrl}
									marginTop=".5rem"
									display={{ base: 'none', md: 'inline-block' }}
									fontSize="1.4rem"
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
