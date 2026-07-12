# Start development

Prepare deps
- Install deps via `npm install`
- Build deps via `npm run build --workspace=twofish`

Configure repo to run tests
- Install the Playwright `npx playwright install --with-deps`
- To install Playwright on Linux Fedora, [use Distrobox](https://gist.github.com/pskopek/de9d79cf0511839dd5c97703be5cc624)

Test code with `npm test`. We have following suffixes for test files
- `.dom.test.ts` for tests that use JSDOM
- `.browser.test.ts` for tests that use a vitest Playwright integration

So for example if you want to run browser tests, just run `npm test .browser`