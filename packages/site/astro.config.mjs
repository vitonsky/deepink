/* eslint-disable import/no-unresolved */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import path from 'node:path';

import { defineConfig } from 'astro/config';
import remarkExternalLinks from 'remark-external-links';
import svgr from 'vite-plugin-svgr';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
    // TODO: update site URL
    site: 'https://site',
    vite: {
        ssr: {
            // Fix build error. See details at https://github.com/withastro/astro/issues/14117#issuecomment-3117797751
            noExternal: ['zod'],
        },
        plugins: [
            svgr({
                include: '**/*.svg?react',
                svgrOptions: {
                    plugins: ['@svgr/plugin-svgo', '@svgr/plugin-jsx'],
                    svgoConfig: {
                        plugins: [
                            'preset-default',
                            'removeTitle',
                            'removeDesc',
                            'removeDoctype',
                            'cleanupIds',
                        ],
                    },
                },
            }),
            {
                name: 'watch-external-dir',
                configureServer(server) {
                    const watchedDir = path.resolve(`src/i18n/locales`);

                    // Tell Vite to watch this directory
                    server.watcher.add(watchedDir);

                    server.watcher.on('change', (file) => {
                        if (file.startsWith(watchedDir)) {
                            server.ws.send({ type: 'full-reload' });
                        }
                    });
                },
            },
        ],
    },
    markdown: {
        remarkPlugins: [
            [remarkExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
        ],
    },
    integrations: [
        starlight({
            title: 'My Docs',
            social: [
                {
                    icon: 'github',
                    label: 'GitHub',
                    href: 'https://github.com/withastro/starlight',
                },
            ],
            sidebar: [
                {
                    label: 'Guides',
                    items: [
                        // Each item here is one entry in the navigation menu.
                        { label: 'Example Guide', slug: 'guides/example' },
                    ],
                },
                {
                    label: 'Reference',
                    autogenerate: { directory: 'reference' },
                },
            ],
        }),
        react(),
    ],
});
