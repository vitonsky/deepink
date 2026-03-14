import { ITag } from '@core/features/tags';

export type TagNode = Pick<ITag, 'id' | 'name'> & {
	childrens?: TagNode[];
};
