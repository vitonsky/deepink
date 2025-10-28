prepare:
	npm install

build: prepare
	npm run build

make-win:
	NODE_OPTIONS=--max-old-space-size=4096 NODE_ENV=production npm run build