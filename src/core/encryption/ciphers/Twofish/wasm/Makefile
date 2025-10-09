build:
	rm -rf ./out && mkdir -p out
	docker run --rm -v $(PWD):/src -u $(shell id -u):$(shell id -g)   emscripten/emsdk emcc twofish2.c -O3 -msimd128 -s MODULARIZE=1 -s 'EXPORT_NAME="TwofishModule"'   -s EXPORTED_FUNCTIONS="['_blockEncrypt', '_cipherInit', '_malloc', '_free']"  -s EXPORTED_RUNTIME_METHODS=[ccall,cwrap,FS] -o out/twofish.js

serve:
	http-server