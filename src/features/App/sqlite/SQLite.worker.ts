import { expose } from 'comlink';

import { Database } from './Database';
import { SQLiteDB } from '.';

// Export worker stub to keep calm the TypeScript
export default null as unknown as new () => Worker;

expose(new Database() as SQLiteDB);
