# Native modules rebuilding

We use native node modules like `better-sqlite3`, that may occurs an errors like:

```
index.tsx:236 Error: The module '.../better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 108. This version of Node.js requires
NODE_MODULE_VERSION 116. Please try re-compiling or re-installing
the module (for instance, using `npm rebuild` or `npm install`).
```

To resolve this problem, you can rebuild native modules for target you need:
- Run `npm rebuild` to rebuild for your node environment
- Run `npx electron-builder install-app-deps` to rebuild for electron's node version

This problem occurs, because we use native modules as "external modules" in webpack config. We do it, because still cannot to setup build a native modules for electron while building application