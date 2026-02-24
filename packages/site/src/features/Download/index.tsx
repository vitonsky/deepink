import React, { Fragment, type ReactNode, useEffect, useMemo, useState } from 'react';
import { BiCloudDownload } from 'react-icons/bi';
import { FaApple, FaLinux, FaWindows } from 'react-icons/fa6';
import { Box, Heading, HStack, SimpleGrid, VStack } from '@chakra-ui/react';

import Layout, { type LayoutProps } from '../../components/Layout/Layout';
import { Link } from '../../components/Link';
import { Text } from '../../components/Text';
import { TheRock } from '../../components/TheRock';

const getPlatform = () => {
	let os: 'Windows' | 'macOS' | 'Linux' = 'Windows';

	if (typeof window !== 'undefined') {
		if (navigator.appVersion.includes('Mac')) {
			os = 'macOS';
		} else if (
			navigator.appVersion.includes('Linux') ||
			navigator.appVersion.includes('X11')
		) {
			os = 'Linux';
		}
	}

	return os;
};

const script = `(function(){
  var s = document.currentScript.previousElementSibling;
  var p = navigator.platform;
  var v = navigator.appVersion;
  s.textContent =
    /iPad|iPhone|iPod/.test(p) || (p === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'iOS' :
    /Android/.test(v) ? 'Android' :
    v.includes('Mac') ? 'macOS' :
    v.includes('Linux') || v.includes('X11') ? 'Linux' :
    'Windows';
})();`;

export const PlatformName = () => {
	return (
		<>
			<span>{getPlatform()}</span>
			<script dangerouslySetInnerHTML={{ __html: script }} />
		</>
	);
};

type DownloadGroup = {
	title: string;
	icon: ReactNode;
	links: {
		title: string;
		url: string;
	}[];
};

export default function Page({
	i18n,
	versions,
}: Pick<LayoutProps, 'i18n'> & {
	versions: {
		url: string;
		name: string;
		publishedAt: string | null;
		prerelease: boolean;
		assets: {
			name: string;
			url: string;
		}[];
	}[];
}) {
	const { downloads, linkMap } = useMemo(() => {
		const msi = versions[0].assets.find((version) =>
			version.name.endsWith('.msi'),
		)?.url;
		const mac = versions[0].assets.find((version) =>
			version.name.endsWith('.dmg'),
		)?.url;

		const appImage = versions[0].assets.find((version) =>
			version.name.endsWith('.AppImage'),
		)?.url;
		const deb = versions[0].assets.find((version) =>
			version.name.endsWith('.deb'),
		)?.url;
		const rpm = versions[0].assets.find((version) =>
			version.name.endsWith('.rpm'),
		)?.url;

		const downloads: DownloadGroup[] = [];

		if (msi)
			downloads.push({
				title: 'Windows',
				icon: <FaWindows />,
				links: [{ title: 'Universal', url: msi }],
			});
		if (mac)
			downloads.push({
				title: 'Mac',
				icon: <FaApple />,
				links: [{ title: 'Apple Silicon', url: mac }],
			});
		if (appImage || deb || rpm)
			downloads.push({
				title: 'Linux',
				icon: <FaLinux />,
				links: [
					appImage ? { title: 'AppImage', url: appImage } : undefined,
					deb ? { title: 'Deb', url: deb } : undefined,
					rpm ? { title: 'Rpm', url: rpm } : undefined,
				].filter((i) => i !== undefined),
			});

		const linkMap = {
			Windows: msi,
			macOS: mac,
			Linux: appImage || deb || rpm,
		};

		return {
			downloads,
			linkMap,
		};
	}, [versions]);

	const [downloadLink, setDownloadLink] = useState(linkMap.Windows);
	useEffect(() => {
		const url = linkMap[getPlatform()];

		if (url) setDownloadLink(url);
	}, [linkMap]);

	const lastReleaseDate = useMemo(() => {
		const date = versions[0].publishedAt;
		if (!date) return null;

		return new Intl.DateTimeFormat('en', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		}).format(new Date(date));
	}, [versions]);

	return (
		<Layout i18n={i18n}>
			<VStack paddingBlock="8rem" justifyContent="center" gap="3rem">
				<VStack gap="3rem">
					<TheRock maxW="100%" width="350px" />

					<VStack gap="1rem">
						<Link variant="button-primary" href={downloadLink}>
							Download for <PlatformName />
						</Link>
						{lastReleaseDate && (
							<Text variant="description" fontFamily="monospace">
								Last updated {lastReleaseDate}
							</Text>
						)}
					</VStack>
				</VStack>

				<VStack
					maxWidth="500px"
					width="100%"
					padding="2rem"
					border="3px solid"
					borderColor="border.contrast"
					borderRadius="6px"
					gap="3rem"
				>
					<Heading>Download links</Heading>
					<SimpleGrid
						columns={2}
						width="100%"
						fontSize="20px"
						css={{
							rowGap: '1.5rem',
							'& > *:not(:nth-last-child(-n + 2))': {
								paddingBottom: '1.5rem',
								borderBottom: '1px solid',
								borderColor: 'border.thin',
							},
						}}
					>
						{downloads.map((section) => (
							<Fragment key={section.title}>
								<Text as={HStack} textAlign="start" gap=".3em">
									{section.icon}
									<span>{section.title}</span>
								</Text>
								<VStack align="start">
									{section.links.map((link) => (
										<Link key={link.url} href={link.url}>
											<HStack gap=".3em">
												<Box as={BiCloudDownload} />
												<span>{link.title}</span>
											</HStack>
										</Link>
									))}
								</VStack>
							</Fragment>
						))}
					</SimpleGrid>
				</VStack>
			</VStack>
		</Layout>
	);
}
