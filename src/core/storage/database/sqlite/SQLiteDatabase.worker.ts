import { expose } from 'comlink';

import { SQLiteDatabase } from './SQLiteDatabase';
import { SQLiteDB } from '.';

// Export worker stub to keep calm the TypeScript
export default null as unknown as new () => Worker;

expose(new SQLiteDatabase() as SQLiteDB);
