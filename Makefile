prepare:
	npm install

build: prepare
	npm run build

make-win:
	set NODE_OPTIONS=--max-old-space-size=4096 && set NODE_ENV=production && npm run make