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
			fontSize: '12px',
			fontWeight: '500',
			width: '100%',
		},
	},
	variants: {
		default: {
			root: {
				color: 'control.option.foreground',
				backgroundColor: 'transparent',
				borderRadius: '4px',

				'&:hover': {
					backgroundColor: 'control.option.hover.background',
				},

				_selected: {
					background: 'control.option.active.background',
					color: 'control.option.active.accentForeground',
				},
			},
			text: {
				color: 'control.option.foreground',
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
