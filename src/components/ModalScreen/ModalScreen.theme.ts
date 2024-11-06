import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

export const ModalScreenTheme = createMultiStyleConfigHelpers([
	'root',
	'head',
	'body',
	'content',
]).defineMultiStyleConfig({
	baseStyle: {
		head: {
			position: 'sticky',
			top: '0',
			width: '100%',
			padding: '.3rem 1rem',
			backgroundColor: 'surface.contrastPanel',
			borderBottom: '1px solid',
			borderColor: 'surface.border',
		},
		body: {
			display: 'flex',
			flex: '1',
			width: '100%',
			justifyContent: 'center',
		},
		content: {
			maxWidth: '800px',
		},
	},
});
