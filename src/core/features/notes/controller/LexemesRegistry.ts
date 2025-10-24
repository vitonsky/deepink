import { z } from 'zod';
import { PGLiteDatabase } from '@core/storage/database/pglite/PGLiteDatabase';
import { qb } from '@utils/db/query-builder';
import { wrapDB } from '@utils/db/wrapDB';

const WordScheme = z.object({ word: z.string() }).transform(({ word }) => word);

export class LexemesRegistry {
	constructor(private readonly db: PGLiteDatabase) {}

	/**
	 * Inner method for debug purposes only
	 */
	public async getList(): Promise<string[]> {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(qb.sql`SELECT word FROM lexemes`, WordScheme);

		return rows;
	}

	public async prune(): Promise<string[]> {
		return this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			// Delete unused lexemes
			const { rows } = await db.query(
				qb.sql`DELETE FROM lexemes l WHERE NOT EXISTS (SELECT 1 FROM notes n WHERE n.text_tsv @@ l.query LIMIT 1) RETURNING word`,
				WordScheme,
			);

			await db.query(
				qb.sql`INSERT INTO lexeme_ops(action, changes) VALUES('cleanup', ${rows.length})`,
			);

			return rows;
		});
	}

	public async index(): Promise<string[]> {
		return this.db.get().transaction(async (tx) => {
			const db = wrapDB(tx);

			const textsQuery = qb.sql`SELECT text_tsv FROM notes WHERE updated_at >= COALESCE((SELECT executed_at FROM lexeme_ops ORDER BY executed_at DESC LIMIT 1), to_timestamp(0))`;

			const { rows } = await db.query(
				qb.sql`INSERT INTO lexemes(word, query) SELECT word, plainto_tsquery('simple', word) AS query FROM ts_stat(E'${textsQuery}') ON CONFLICT DO NOTHING RETURNING word`,
				WordScheme,
			);

			await db.query(
				qb.sql`INSERT INTO lexeme_ops(action, changes) VALUES('scan', ${rows.length})`,
			);

			return rows;
		});
	}

	public async getSuggests(lexemes: string[], { limit }: { limit?: number } = {}) {
		const db = wrapDB(this.db.get());

		const { rows } = await db.query(
			qb.line(
				qb.sql`SELECT t.word, COALESCE(array_agg(l.word) FILTER(WHERE l.word IS NOT NULL), ARRAY[]::text[]) AS suggests
					FROM unnest(${lexemes}::text[]) WITH ORDINALITY as t(word, seq)
					LEFT JOIN lexemes l ON l.word % t.word AND l.word != t.word
					GROUP BY (t.word, t.seq)
					ORDER BY t.seq`,
				qb.limit(limit),
			),
			z.object({ word: z.string(), suggests: z.string().array() }),
		);

		return rows;
	}
}
