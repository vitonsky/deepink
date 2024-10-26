import {
	createMultiStyleConfigHelpers,
	defineStyleConfig,
	extendTheme,
} from '@chakra-ui/react';

export const theme = extendTheme({
	colors: {
		surface: '#fdfdfd',
		dim: {
			50: '#f5f5f5',
			100: '#f3f3f3',
			// #e3e3e3
			400: '#e7e7e7',
		},
		accent: {
			100: '#e8e6ff',
			500: '#6b00cb',
		},
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
		Menu: defineStyleConfig({
			baseStyle: {
				item: {
					transitionDuration: '0s',
					'&:hover, &:focus': {
						bgColor: '#e6f0ff',
					},
				},
			},
		}),
		Button: defineStyleConfig({
			variants: {
				primary: {
					backgroundColor: '#e6f0ff',
					color: '#0066ff',
					// '&:hover': {
					// 	backgroundColor: '#e8e6ff',
					// 	color: '#6b00cb',
					// },
					'&:hover': {
						backgroundColor: '#d7e7ff',
					},
				},
				secondary: {
					backgroundColor: 'dim.100',
					color: '#3e3d3d',
					// borderWidth: '1px',
					// borderColor: 'dim.400',
					'&:hover': {
						backgroundColor: 'dim.400',
					},
				},
				ghost: {
					'&:hover': {
						backgroundColor: 'dim.400',
					},
				},
			},
			defaultProps: {
				variant: 'secondary',
			},
		}),
		Tag: createMultiStyleConfigHelpers(['container']).defineMultiStyleConfig({
			variants: {
				default: {
					container: {
						backgroundColor: 'dim.100',
						color: '#3e3d3d',
						// borderWidth: '1px',
						// borderColor: 'dim.400',
						'&:hover': {
							backgroundColor: 'dim.400',
						},
					},
				},
				accent: {
					container: {
						backgroundColor: '#e6f0ff',
						color: '#0066ff',
						// '&:hover': {
						// 	backgroundColor: '#e8e6ff',
						// 	color: '#6b00cb',
						// },
						'&:hover': {
							backgroundColor: '#d7e7ff',
						},
					},
				},
			},
			defaultProps: {
				variant: 'default',
			},
		}),
		Tabs: createMultiStyleConfigHelpers(['tab']).defineMultiStyleConfig({
			variants: {
				default: {
					tab: {
						'&:hover': {
							backgroundColor: 'dim.100',
							color: '#3e3d3d',
						},
						_selected: {
							backgroundColor: 'accent.100',
							color: 'accent.500',
							'&:hover': {
								color: 'accent.500',
								backgroundColor: 'accent.100',
							},
						},
					},
				},
			},
			defaultProps: {
				variant: 'default',
			},
		}),
		Select: {
			variants: {
				primary: {
					field: {
						backgroundColor: '#e6f0ff',
						color: '#0066ff',
						'&:hover': {
							backgroundColor: '#e8e6ff',
							color: '#6b00cb',
						},
					},
				},
				secondary: {
					field: {
						backgroundColor: 'dim.100',
						color: '#3e3d3d',
						// borderWidth: '1px',
						// borderColor: 'dim.400',
						'&:hover': {
							backgroundColor: 'dim.400',
						},
					},
				},
			},
		},
	},
});
