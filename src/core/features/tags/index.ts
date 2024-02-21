export type ITag = {
	id: string;
	/**
	 * Tag name
	 */
	name: string;
	/**
	 * Id of parent tag
	 */
	parent: string | null;
};

export type IResolvedTag = ITag & {
	/**
	 * Tag name with full path like `foo/bar/baz`
	 */
	resolvedName: string;
};
