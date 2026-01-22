import React from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import {
	Button,
	HStack,
	Input,
	InputGroup,
	InputRightElement,
	Text,
	VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { getDefaultZoomFactor, getZoomFactor, setZoomFactor } from '@utils/os/zoom';

const zoomLimits = {
	min: 30,
	max: 500,
};

const zoomScheme = z.object({
	zoom: z.coerce
		.number({ message: 'Enter a zoom in percents' })
		.min(zoomLimits.min, `Zoom cannot be less than ${zoomLimits.min}%`)
		.max(zoomLimits.max, `Zoom cannot be more than ${zoomLimits.max}%`)
		.transform((v) => Number((v / 100).toFixed(3))),
});

const zoomFactorToPercents = (factor: number) => Math.round(factor * 100);

export const AppZoomLevel = () => {
	const form = useForm({
		delayError: 500,
		defaultValues: {
			zoom: zoomFactorToPercents(getZoomFactor()),
		},
		resolver: zodResolver(zoomScheme),
		shouldFocusError: true,
		reValidateMode: 'onChange',
	});

	return (
		<VStack
			as="form"
			onSubmit={form.handleSubmit(async ({ zoom }) => {
				setZoomFactor(zoom);
			})}
			align="start"
		>
			<HStack align="start">
				<InputGroup size="sm" width="auto">
					<Input
						placeholder="e.g. 100"
						width="6rem"
						textAlign="right"
						type="number"
						min={zoomLimits.min}
						max={zoomLimits.max}
						{...form.register('zoom')}
					/>
					<InputRightElement pointerEvents="none">
						<Text variant="secondary">%</Text>
					</InputRightElement>
				</InputGroup>
				<Button size="sm" type="submit">
					Apply
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						const defaultZoom = getDefaultZoomFactor();

						setZoomFactor(defaultZoom);
						form.reset({
							zoom: zoomFactorToPercents(defaultZoom),
						});
					}}
				>
					Reset
				</Button>
			</HStack>
			{Object.entries(form.formState.errors).map(([id, error]) => {
				return (
					<Text key={id} variant="error" size="sm">
						{error.message}
					</Text>
				);
			})}
		</VStack>
	);
};
