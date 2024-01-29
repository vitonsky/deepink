# Native modules rebuilding

We use native node modules like `better-sqlite3`, since an [Electron ABI different of NodeJS](https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules), it may occurs an errors like:

```
index.tsx:236 Error: The module '.../better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 108. This version of Node.js requires
NODE_MODULE_VERSION 116. Please try re-compiling or re-installing
the module (for instance, using `npm rebuild` or `npm install`).
```

To resolve this problem, you should rebuild native modules for target you need:
- Run `npm rebuild` to rebuild for your node environment
- Run `npx electron-builder install-app-deps` to rebuild for electron's node version
