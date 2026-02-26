/* eslint-disable @cspell/spellchecker */
const context = `
Context:
- Product: Deepink, a privacy-first note-taking app.
- Audience: primarily women aged 26–38 across mixed professions (e.g., aircraft engineer, programmer, lawyer, sales agent) who are smart, busy, and not necessarily IT-oriented. The copy must remain gender-neutral (never address “women” directly) and welcoming to men as well.
- Brand voice: confident, calm, and slightly elegant; subtle warmth is fine, but no stereotypes, no “productivity-bro” tone, no cute/flirty lines, and no forced metaphors.
- The "vault" is an idiom that means a database with user content. Not a physical object. So don't confuse a users with a box that keeps money, and find the correct word in a target language.

Requirements:
- Produce a native, natural-sounding translation that reads like original copy written in target language, not a literal translation.
- Preserve meaning, tone, and persuasion level: clear, confident, and concise (no slang; no corporate jargon).
- Keep the text easy to understand for non-technical users while staying accurate for technical users.
- Avoid English idioms that don’t translate well. If an idiom/metaphor would sound unnatural, replace it with a culturally natural equivalent.
- Prefer concrete verbs and clear subjects. Remove ambiguity (e.g., specify what is unlocked/edited if English is unclear).
- Keep terminology consistent across the whole text (e.g., “vault”, “workspace”, “note”). If a term should remain in English, keep it consistently; otherwise translate it consistently.
- Don’t add new claims, features, or extra explanations. Don’t remove meaning.
- Avoid any imperative in translation. Translated text must not to say to user what to do. The text must explain what Deepink can do for the user. Reader are authoritative persons who don't like to hear what to do.
- Bring the value in texts, not a fluff. Every slogan and description must contain the completed and insightful thought, not just the emotions.
	- Bad: "Deepink — приложение для заметок с <0>акцентом на приватность</0>, которое помогает поддерживать идеальный порядок.". The "идеальный порядок" is a fluff, user can't understand why it does matter and why they needed in that.
	- Good: "Deepink — приложение для быстрого создания и огранизации заметок, <0>уважающее вашу приватность</0>.". That is ergonomic and elegant description that explains the elaborates what exactly Deepink can organize, and how exactly it can be useful for user in real world.

Constraints:
- Preserve all literal newline escapes like "\n\n" and paragraph structure.
- Don’t introduce punctuation/formatting that complicates localization.
- When text is wrapped via some substitutions <0>like that</0>, you must analyze what exactly is highlighted in original text from a semantic perspective, and wrap equal segment in the translation.
`.trim();

// See config reference at https://github.com/Quilljou/transmart#options
module.exports = {
	baseLocale: 'en',
	locales: ['ru'],
	localePath: './locales',

	openAIApiKey: process.env.OPENAI_API_KEY,
	openAIApiUrl: process.env.OPENAI_API_URL,
	openAIApiModel: 'google/gemini-3-flash-preview',
	// openAIApiModel: 'openai/gpt-4o-mini',
	context,
};
