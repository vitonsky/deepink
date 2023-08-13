import React, { FC } from 'react';
import { cn } from '@bem-react/classname';

import { ListItem, TagsList } from './TagsList';

import './NotesOverview.css';

export const cnNotesOverview = cn('NotesOverview');

const tags: ListItem[] = [
	{
		id: '1',
		content: "foo"
	},
	{
		id: '2',
		content: "bar",
		childrens: [
			{
				id: '3',
				content: 'Nested 1'
			},
			{
				id: '4',
				content: 'Nested 2',
				childrens: [
					{
						id: '5',
						content: 'Nested 2 1'
					},
					{
						id: '6',
						content: 'Nested 2 2',
						childrens: [
							{
								id: '7',
								content: 'Nested 2 2 1',
								childrens: [
									{
										id: '8',
										content: 'Nested 2 1'
									},
									{
										id: '9',
										content: 'Nested 2 2'
									},
									{
										id: '10',
										content: 'Nested 2 3'
									},
								]
							},
						]
					},
					{
						id: '11',
						content: 'Nested 2 3'
					},
				]
			},
			{
				id: '12',
				content: 'Nested 3'
			},
		]
	},
	{
		id: '13',
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
