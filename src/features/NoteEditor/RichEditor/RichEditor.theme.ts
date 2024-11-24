import { createMultiStyleConfigHelpers } from '@chakra-ui/react';

import { theme } from './theme/RichEditor';

export const RichEditorTheme = createMultiStyleConfigHelpers([
	'root',
]).defineMultiStyleConfig({
	baseStyle: {
		root: {
			'& pre': {
				whiteSpace: 'break-spaces',
			},
			[`& .${theme.heading.h1}, & .${theme.heading.h2}`]: {
				borderColor: 'surface.border',
			},
			[`& .${theme.hr}`]: {
				borderColor: 'surface.border',
			},
			[`& .${theme.link}`]: {
				borderColor: 'link.base',
			},
			[`& .${theme.quote}`]: {
				color: 'typography.secondary',
				borderColor: 'surface.border',
			},
			[`& .${theme.code}, & .${theme.text.code}`]: {
				color: 'typography.primary',
				backgroundColor: 'dim.100',
			},
			[`& .${theme.code}`]: {
				backgroundColor: 'dim.100',
				'&:before': {
					backgroundColor: 'dim.400',
				},
			},
			[`& .${theme.image}`]: {
				display: 'inline-flex',
				maxWidth: '100%',
				'& img': {
					display: 'flex',
					maxWidth: '100%',
				},
			},
		},
	},
});
