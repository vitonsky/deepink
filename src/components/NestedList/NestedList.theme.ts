import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

export const NestedListTheme = createMultiStyleConfigHelpers([
	'root',
	'item',
	'content',
	'group',
]).defineMultiStyleConfig({
	baseStyle: {
		root: {
			margin: '0',
			paddingLeft: '0',
			listStyle: 'none',
			// eslint-disable-next-line spellcheck/spell-checker
			fontFamily: 'Arial, Helvetica, sans-serif',
			userSelect: 'none',
			'& &': {
				paddingStart: '.5rem',
			},
			w: '100%',
			gap: '0',
		},
		item: {
			w: '100%',
			lineHeight: '1rem',
			gap: '0',
		},
		content: {
			w: '100%',
			borderRadius: '4px',
		},
		group: {
			w: '100%',
			paddingStart: '.5rem',
		},
	},
	variants: {
		default: {
			content: {
				color: 'variants.ghost.foreground',
				backgroundColor: 'transparent',

				'&:hover': {
					backgroundColor: 'variants.ghost.background',
				},

				_selected: {
					color: 'variants.ghost.active.foreground',
					background: 'variants.ghost.active.background',
				},
			},
		},
	},
	defaultProps: {
		variant: 'default',
	},
});
