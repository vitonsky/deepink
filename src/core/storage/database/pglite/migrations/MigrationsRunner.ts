import { MigrateUpOptions, MigrationMeta, Umzug } from 'umzug';

/**
 * Extends `Umzug` and implements verifications for migrations order
 */
export class MigrationsRunner<Ctx extends object = object> extends Umzug<Ctx> {
	public async up(options?: MigrateUpOptions): Promise<MigrationMeta[]> {
		// Ensure correct order
		const context = (
			typeof this.options.context === 'function'
				? this.options.context()
				: this.options.context
		) as Ctx;
		const migrations = await this.migrations(context);

		const { storage } = this.options;
		if (!storage) throw new Error('Storage not found');

		const executed = await storage.executed({ context });
		executed.forEach((name, index) => {
			const migration = migrations[index];
			if (migration === undefined)
				throw new Error(
					`Migrations list miss a migration "${name}" at index ${index}. Incomplete migrations list ${migrations.length}/${executed.length}`,
				);
			if (name !== migration.name)
				throw new Error(
					`Names of applied migration "${name}" and migration at index ${index} is not match. Wrong order of migrations list?`,
				);
		});

		// Run migration
		return super.up(options);
	}
}
