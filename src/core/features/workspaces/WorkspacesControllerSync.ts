import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';

import { WorkspacesController } from './WorkspacesController';

/**
 * Decorator for WorkspacesController that calls db synchronization after data changes
 */
export class WorkspacesControllerSync {
	constructor(
		private readonly controller: WorkspacesController,
		private readonly db: PGLiteDatabase,
	) {}

	public async create({ name }: { name: string }) {
		const result = await this.controller.create({ name });
		await this.db.sync();
		return result;
	}

	public async get(id: string) {
		return await this.controller.get(id);
	}

	public async update(id: string, options: { name?: string }) {
		await this.controller.update(id, options);
		await this.db.sync();
	}

	public async getList() {
		return await this.controller.getList();
	}

	public async delete(ids: string[]) {
		await this.controller.delete(ids);
		await this.db.sync();
	}
}
