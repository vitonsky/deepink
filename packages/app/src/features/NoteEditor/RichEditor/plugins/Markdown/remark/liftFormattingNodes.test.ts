import { Root } from 'mdast';
import { u } from 'unist-builder';

import { liftFormattingNodes } from './remarkLiftFormatting';

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
