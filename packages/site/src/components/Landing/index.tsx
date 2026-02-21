// TODO: fix all typos
/* eslint-disable @cspell/spellchecker */
import React, { Fragment, type ReactNode } from 'react';
import clsx from 'clsx';

import RichLogo from './app.svg?react';
import Logo from './icon-simple.svg?react';

import styles from './index.module.css';

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
	image: string;
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
					Your information shouldn’t live in silos. With Links, it becomes a
					network.
				</p>
			</>
		),
		image: 'https://obsidian.md/images/sync-settings.png',
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
					a meeting with confidence, knowing personal or sensitive areas won’t
					surface by accident.
				</p>

				<p>One vault. Clear boundaries. Zero friction.</p>
			</>
		),
		image: 'https://obsidian.md/images/sync-settings.png',
	},
	{
		title: 'History',
		content: (
			<>
				<p>Every note keeps its own timeline.</p>

				<p>
					Deepink automatically saves previous versions, so you can review what
					changed, restore an earlier draft, or track how an idea evolved over
					time. Whether it’s yesterday’s edit or something from a year ago,
					nothing important is lost.
				</p>

				<p>
					History gives you confidence to refine, rewrite, and rethink — knowing
					every step is preserved and accessible when you need it.
				</p>
			</>
		),
		image: 'https://obsidian.md/images/sync-settings.png',
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
		image: 'https://obsidian.md/images/sync-settings.png',
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
		image: 'https://obsidian.md/images/sync-settings.png',
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
					Attachments aren’t left exposed. Metadata isn’t readable. Even file
					sizes are obfuscated to reduce the risk of analysis.
				</p>

				<p>What you store stays private — completely, by design.</p>
			</>
		),
		image: 'https://obsidian.md/images/sync-settings.png',
	},
];

// TODO: update texts and images. Explain the product
// TODO: split into components and infer layout to reuse
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
	return (
		<div className={styles.Page}>
			<header className={styles.Header}>
				<div className={clsx(styles.HeaderContent, styles.Container__fullWidth)}>
					<a href="/" className={styles.AppLink}>
						<Logo />
						<span>Deepink</span>
					</a>

					<nav
						aria-label="Main navigation"
						className={clsx(styles.Navigation, styles.Navigation__type_main)}
					>
						<a href="/download">Download</a>
						<a href="#features">Features</a>
						<a href="/guides/example/">Docs</a>
					</nav>

					<nav
						className={clsx(styles.Navigation, styles.Navigation__type_pulse)}
					>
						<a href="#">Blog</a>
						<a href="#">Changelog</a>
					</nav>
				</div>
			</header>

			<main className={styles.Container__fullWidth}>
				<section className={clsx(styles.Hero)}>
					<div className={styles.Hero_Message}>
						<h2 className={styles.Hero_Header}>Snapshot your thoughts.</h2>
						<p className={styles.Hero_Description}>
							Deepink is a <b>privacy focused</b> note taking app with a
							light speed workflow.
						</p>
						<div className={styles.Hero_Actions}>
							<a
								href="/download"
								className={clsx(
									styles.Hero_Button,
									styles.Hero_Button__view_primary,
								)}
							>
								Download
							</a>
							<a href="/download" className={styles.Hero_Button}>
								See features
							</a>
						</div>
					</div>
					<img src="https://www.zettlr.com/themes/zettlr/assets/img/zettlr_v3.png" />
				</section>

				<section className={clsx(styles.Summary)}>
					<div className={clsx(styles.Highlights)}>
						{highlights.map((feature) => (
							<div
								key={feature.title}
								className={clsx(styles.Highlights_Item)}
							>
								<h3 className={clsx(styles.Highlights_Title)}>
									{feature.title}
								</h3>
								<p className={clsx(styles.Highlights_Description)}>
									{feature.content}
								</p>
							</div>
						))}
					</div>

					<div className={clsx(styles.SummaryAction)}>
						<RichLogo className={clsx(styles.SummaryAction_Logo)} />

						<div className={clsx(styles.SummaryAction_Content)}>
							<div className={clsx(styles.SummaryAction_Text)}>
								Free without limits.
							</div>

							<a
								href="/download"
								className={clsx(styles.SummaryAction_Link)}
							>
								Download now
							</a>
						</div>
					</div>
				</section>

				<section className={clsx(styles.Features)}>
					<div className={clsx(styles.Features_Intro)}>
						<h3 className={clsx(styles.Features_IntroTitle)}>
							Your Thinking, Structured
						</h3>
						<p className={clsx(styles.Features_IntroText)}>
							Capture a quick insight or shape something complex — Deepink
							brings order, focus, and structure to every idea.
						</p>
						<hr />
					</div>

					<div className={clsx(styles.Features_List)}>
						{features.map((feature) => (
							<div key={feature.title} className={clsx(styles.Feature)}>
								<h3 className={clsx(styles.Feature_Title)}>
									{feature.title}
								</h3>
								<p className={clsx(styles.Feature_Description)}>
									{feature.content}
								</p>
								<p className={clsx(styles.Feature_Image)}>
									<img src={feature.image} />
								</p>
							</div>
						))}
					</div>
				</section>

				<section className={clsx(styles.CTA)}>
					<h3 className={clsx(styles.CTA_Title)}>Spark ideas</h3>
					<p className={clsx(styles.CTA_Text)}>
						From personal notes to journaling, knowledge bases, and project
						management, Obsidian gives you the tools to come up with ideas and
						organize them.
					</p>
					<a
						href="/download"
						className={clsx(
							styles.CTA_Action,
							styles.Hero_Button,
							styles.Hero_Button__view_primary,
						)}
					>
						Download
					</a>
				</section>
			</main>

			<footer className={clsx(styles.Footer)}>
				<div className={clsx(styles.Container__fullWidth, styles.Footer_Content)}>
					<div className={clsx(styles.Footer_About)}>
						<a href="/" className={styles.AppLink}>
							<Logo />
							<span>Deepink</span>
						</a>

						<div className={clsx(styles.LinksGroup)}>
							<div className={clsx(styles.LinksGroup_Title)}>Follow us</div>

							<ul className={clsx(styles.LinksGroup_List)}>
								<li className={styles.LinksGroup_Link}>
									<a href="/">GitHub</a>
								</li>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Mastodon</a>
								</li>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Bluesky</a>
								</li>
							</ul>
						</div>

						<small className={clsx(styles.Footer_Copyright)}>
							© {new Date().getFullYear()} Deepink
						</small>
					</div>

					<div className={clsx(styles.Footer_Links)}>
						<div className={clsx(styles.LinksGroup)}>
							<div className={clsx(styles.LinksGroup_Title)}>
								Get started
							</div>

							<ul className={clsx(styles.LinksGroup_List)}>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Download</a>
								</li>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Docs</a>
								</li>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Overview</a>
								</li>
							</ul>
						</div>

						<div className={clsx(styles.LinksGroup)}>
							<div className={clsx(styles.LinksGroup_Title)}>Learn</div>

							<ul className={clsx(styles.LinksGroup_List)}>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Help</a>
								</li>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Changelog</a>
								</li>
								<li className={styles.LinksGroup_Link}>
									<a href="/">About</a>
								</li>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Roadmap</a>
								</li>
							</ul>
						</div>

						<div className={clsx(styles.LinksGroup)}>
							<div className={clsx(styles.LinksGroup_Title)}>Resources</div>

							<ul className={clsx(styles.LinksGroup_List)}>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Terms of Use</a>
								</li>
								<li className={styles.LinksGroup_Link}>
									<a href="/">Privacy Policy</a>
								</li>
							</ul>
						</div>
					</div>
				</div>

				<div className={clsx(styles.Container__fullWidth, styles.Footer_Content)}>
					<div className={clsx(styles.Footer_LanguagesList)}>
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
								<a href={`/${language}`}>
									{getNativeLanguageName(language)?.trim()}
								</a>
							</Fragment>
						))}
					</div>
				</div>
			</footer>
		</div>
	);
}
