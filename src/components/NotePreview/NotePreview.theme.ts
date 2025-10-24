import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

export const NotePreviewTheme = createMultiStyleConfigHelpers([
	'root',
	'body',
	'title',
	'text',
	'meta',
]).defineMultiStyleConfig({
	baseStyle: {
		root: {
			cursor: 'pointer',
			padding: '0.5rem',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
			width: '100%',
			alignItems: 'start',
			gap: '0.6rem',
		},
		body: {
			gap: '0.2rem',
			alignItems: 'start',
			maxWidth: '100%',
		},
		title: {
			fontWeight: 'bold',
			fontSize: '18px',
		},
		text: {
			fontSize: '14px',
			maxWidth: '100%',
		},
		meta: {
			fontSize: '14px',
			width: '100%',
		},
	},
	variants: {
		default: {
			root: {
				color: 'typography.primary',

				'&:not([aria-selected=true]):hover': {
					backgroundColor: 'dim.100',
				},

				_selected: {
					backgroundColor: 'accent.100',
					color: 'accent.500',
				},
			},
			meta: {
				color: 'typography.ghost',
			},
		},
	},
	defaultProps: {
		variant: 'default',
	},
});
