import { parseArgs } from './args';
import main from './main';

main(parseArgs()).catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});
