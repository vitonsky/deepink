import { Root } from 'mdast';
import { u } from 'unist-builder';

import { liftFormattingNodes } from './remarkLiftFormatting';

describe('Normalize Lexical tree', () => {
	test('Complex formatting', () => {
		expect(
			liftFormattingNodes({
				type: 'root',
				children: [
					{
						type: 'paragraph',
						children: [
							{
								type: 'emphasis',
								children: [
									{
										type: 'text',
										value: 'All text can be italic, something additionally can be ',
									},
								],
							},
							{
								type: 'emphasis',
								children: [
									{
										type: 'strong',
										children: [{ type: 'text', value: 'bold' }],
									},
								],
							},
							{
								type: 'emphasis',
								children: [{ type: 'text', value: ', ' }],
							},
							{
								type: 'delete',
								children: [
									{
										type: 'emphasis',
										children: [
											{ type: 'text', value: 'strikethrough' },
										],
									},
								],
							},
							{
								type: 'emphasis',
								children: [{ type: 'text', value: ', or ' }],
							},
							{
								type: 'delete',
								children: [
									{
										type: 'emphasis',
										children: [
											{
												type: 'strong',
												children: [
													{
														type: 'text',
														value: 'bold AND strikethrough',
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			} satisfies Root),
		).toEqual({
			type: 'root',
			children: [
				{
					type: 'paragraph',
					children: [
						{
							type: 'emphasis',
							children: [
								{
									type: 'text',
									value: 'All text can be italic, something additionally can be ',
								},
								{
									type: 'strong',
									children: [{ type: 'text', value: 'bold' }],
								},
								{ type: 'text', value: ', ' },
								{
									type: 'delete',
									children: [{ type: 'text', value: 'strikethrough' }],
								},
								{ type: 'text', value: ', or ' },
								{
									type: 'strong',
									children: [
										{
											type: 'delete',
											children: [
												{
													type: 'text',
													value: 'bold AND strikethrough',
												},
											],
										},
									],
								},
							],
						},
					],
				},
			],
		} satisfies Root);
	});

	test('Grouping siblings', () => {
		expect(
			liftFormattingNodes({
				type: 'root',
				children: [
					{
						type: 'paragraph',
						children: [
							{
								type: 'emphasis',
								children: [
									{
										type: 'text',
										value: 'All text can be italic, something additionally can be ',
									},
								],
							},
							{
								type: 'emphasis',
								children: [
									{
										type: 'strong',
										children: [{ type: 'text', value: 'bold' }],
									},
								],
							},
							{
								type: 'emphasis',
								children: [{ type: 'text', value: ', ' }],
							},
							{
								type: 'delete',
								children: [
									{
										type: 'emphasis',
										children: [
											{ type: 'text', value: 'strikethrough' },
										],
									},
								],
							},
							{
								type: 'delete',
								children: [
									{
										type: 'emphasis',
										children: [
											{
												type: 'strong',
												children: [
													{
														type: 'text',
														value: 'bold AND strikethrough',
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			} satisfies Root),
		).toEqual({
			type: 'root',
			children: [
				{
					type: 'paragraph',
					children: [
						{
							type: 'emphasis',
							children: [
								{
									type: 'text',
									value: 'All text can be italic, something additionally can be ',
								},
								{
									type: 'strong',
									children: [{ type: 'text', value: 'bold' }],
								},
								{ type: 'text', value: ', ' },
								{
									type: 'delete',
									children: [
										{ type: 'text', value: 'strikethrough' },
										{
											type: 'strong',
											children: [
												{
													type: 'text',
													value: 'bold AND strikethrough',
												},
											],
										},
									],
								},
							],
						},
					],
				},
			],
		} satisfies Root);
	});
});

test('Sibling nodes with exact format must be grouped', () => {
	expect(
		liftFormattingNodes(
			u('root', {
				children: [
					u('paragraph', {
						children: [
							u('emphasis', {
								children: [
									u('text', { value: 'Italic text' }),
									u('strong', {
										children: [
											u('delete', {
												children: [
													u('text', {
														value: 'Strong & delete text #1',
													}),
												],
											}),
										],
									}),
									u('strong', {
										children: [
											u('delete', {
												children: [
													u('text', {
														value: 'Strong & delete text #2',
													}),
												],
											}),
										],
									}),
								],
							}),
							u('text', { value: 'Text with no formatting' }),
						],
					}),
				],
			}) satisfies Root,
		),
	).toEqual(
		u('root', {
			children: [
				u('paragraph', {
					children: [
						u('emphasis', {
							children: [
								u('text', { value: 'Italic text' }),
								u('strong', {
									children: [
										u('delete', {
											children: [
												u('text', {
													value: 'Strong & delete text #1',
												}),
												u('text', {
													value: 'Strong & delete text #2',
												}),
											],
										}),
									],
								}),
							],
						}),
						u('text', { value: 'Text with no formatting' }),
					],
				}),
			],
		}) satisfies Root,
	);
});

test('Sibling nodes with equal format must be grouped', () => {
	expect(
		liftFormattingNodes(
			u('root', {
				children: [
					u('paragraph', {
						children: [
							u('emphasis', {
								children: [
									u('text', { value: 'Italic text' }),
									u('delete', {
										children: [
											u('strong', {
												children: [
													u('text', {
														value: 'Strong & delete text #1',
													}),
												],
											}),
										],
									}),
									u('strong', {
										children: [
											u('delete', {
												children: [
													u('text', {
														value: 'Strong & delete text #2',
													}),
												],
											}),
										],
									}),
								],
							}),
							u('text', { value: 'Text with no formatting' }),
						],
					}),
				],
			}) satisfies Root,
		),
	).toEqual(
		u('root', {
			children: [
				u('paragraph', {
					children: [
						u('emphasis', {
							children: [
								u('text', { value: 'Italic text' }),
								u('strong', {
									children: [
										u('delete', {
											children: [
												u('text', {
													value: 'Strong & delete text #1',
												}),
												u('text', {
													value: 'Strong & delete text #2',
												}),
											],
										}),
									],
								}),
							],
						}),
						u('text', { value: 'Text with no formatting' }),
					],
				}),
			],
		}) satisfies Root,
	);
});
