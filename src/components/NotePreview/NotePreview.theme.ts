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
				color: 'control.ghost.foreground',
				backgroundColor: 'transparent',

				'&:hover': {
					backgroundColor: 'control.ghost.background',
				},

				_selected: {
					color: 'control.ghost.active.foreground',
					background: 'control.ghost.active.background',
				},
			},
			meta: {
				color: 'typography.secondary',
			},
		},
	},
	defaultProps: {
		variant: 'default',
	},
});
