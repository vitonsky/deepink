import React from 'react';
import { VStack } from '@chakra-ui/react';

import Layout, { type LayoutProps } from '../../components/Layout/Layout';
import { Link } from '../../components/Link';
import { Text } from '../../components/Text';
import { CONTACT_EMAIL } from '../../config';

export default function Page({ i18n }: Pick<LayoutProps, 'i18n'>) {
	return (
		<Layout i18n={i18n}>
			<VStack minHeight="60vh" justifyContent="center" gap="3rem">
				<VStack gap="0" textAlign="center">
					<Text
						as="h2"
						variant="description"
						fontWeight="500"
						fontSize="20px"
						margin={0}
					>
						404 - Page Not Found
					</Text>
					<Text fontSize="42px">You found an unresolved link.</Text>
				</VStack>

				<Text variant="description" fontSize="22px" textAlign="center">
					Our system have logged the missing page.
					<br />
					If something seems broken{' '}
					<Link href={`mailto:${CONTACT_EMAIL}`} variant="native">
						let us know
					</Link>
					.
				</Text>

				<Link href="/" fontWeight={500} fontSize="20px">
					Back to the home page.
				</Link>
			</VStack>
		</Layout>
	);
}
