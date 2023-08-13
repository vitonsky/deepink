import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import { ListItem, TagsList } from './TagsList';

import './NotesOverview.css';

export const cnNotesOverview = cn('NotesOverview');

const tags: ListItem[] = [
	{
		content: "foo"
	},
	{
		content: "bar",
		childrens: [
			{
				content: 'Nested 1'
			},
			{
				content: 'Nested 2',
				childrens: [
					{
						content: 'Nested 2 1'
					},
					{
						content: 'Nested 2 2',
						childrens: [
							{
								content: 'Nested 2 2 1',
								childrens: [
									{
										content: 'Nested 2 1'
									},
									{
										content: 'Nested 2 2'
									},
									{
										content: 'Nested 2 3'
									},
								]
							},
						]
					},
					{
						content: 'Nested 2 3'
					},
				]
			},
			{
				content: 'Nested 3'
			},
		]
	},
	{
		content: "baz"
	},
];

export type NotesOverviewProps = {
};

export const NotesOverview: FC<NotesOverviewProps> = () => {
	return <TagsList tags={tags} onTagClick={(tagId) => {
		console.warn('Click item', tagId);
	}} />;
};
