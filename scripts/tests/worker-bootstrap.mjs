import { readFileSync } from "node:fs";
import { workerData } from 'node:worker_threads';

import { register } from "tsconfig-paths";

const tsconfig = JSON.parse(readFileSync("./tsconfig.json", "utf-8"));

register({
	baseUrl: "./",
	paths: tsconfig.compilerOptions.paths,
});

await import(workerData.workerPath);