import { IndexOptions, Preset } from 'flexsearch';
import { IFilesStorage } from '@core/features/files';

// TODO: add methods to clear and destroy
export type IndexWorkerApi<Id = string> = {
	init(config: Preset | IndexOptions, storage: IFilesStorage): Promise<void>;

	add(id: Id, content: string): Promise<void>;
	update(id: Id, content: string): Promise<void>;
	remove(id: Id): Promise<void>;
	commit(): Promise<void>;

	search(query: string): Promise<Id[]>;
};
