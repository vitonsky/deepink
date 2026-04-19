import buildWikiBin from './build-bin.ts';
import downloadWiki from './fetch-wiki.ts';

console.log('Download Wiki dataset...');
await downloadWiki();

console.log('Unpack Wiki data into a fast access blob...');
await buildWikiBin();
