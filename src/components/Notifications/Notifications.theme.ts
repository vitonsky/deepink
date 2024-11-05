import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

export const NotificationsTheme = createMultiStyleConfigHelpers([
	'root',
	'head',
	'body',
]).defineMultiStyleConfig({
	baseStyle: {
		root: {
			position: 'absolute',
			bottom: '2rem',
			right: '0.5rem',
			backgroundColor: 'surface.background',
			border: '2px solid #eee',
			borderRadius: '4px',
			minWidth: '300px',
			maxWidth: '500px',
			maxHeight: '500px',
			boxShadow: '0 5px 30px -20px black',
		},
		head: {
			w: '100%',
			padding: '.5rem 1rem',
			backgroundColor: 'surface.contrastPanel',
		},
		body: {
			w: '100%',
			alignItems: 'start',
			padding: '1rem',
		},
	},
});
