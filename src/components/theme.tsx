import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
	colors: {
		primary2: {
			'50': '#E7FEE7',
			'100': '#BCFCBB',
			'200': '#91FA8F',
			'300': '#66F863',
			'400': '#3BF637',
			'500': '#10F40B',
			'600': '#0DC408',
			'700': '#0A9306',
			'800': '#066204',
			'900': '#033102',
		},
		primary: {
			50: '#E6EDFF',
			100: '#B8CBFF',
			200: '#8AAAFF',
			300: '#5C89FE',
			400: '#2F68FE',
			500: '#0146FE',
			600: '#0138CB',
			700: '#012A98',
			800: '#001C66',
			900: '#000E33',
		},
	},
	components: {
		Button: {
			variants: {
				primary: {
					backgroundColor: '#e6f0ff',
					color: '#0066ff',
					'&:hover': {
						backgroundColor: '#e8e6ff',
						color: '#6b00cb',
					},
				},
			},
		},
	},
});
