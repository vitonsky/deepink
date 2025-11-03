clean:
	rm -Rf dist out

prepare:
	npm install

build: prepare
	npm run build

package: clean build
	npx electron-forge package

artifacts:
	npm run make