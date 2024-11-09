import * as React from 'react';
import { useEffect, useState } from 'react';
import { Button, HStack, Input } from '@chakra-ui/react';

export const ImagePropertiesPicker = ({
	src,
	onUpdateUrl,
}: {
	src: string;
	onUpdateUrl: (url: string) => void;
}) => {
	const [urlToEdit, setUrlToEdit] = useState(src);
	useEffect(() => {
		setUrlToEdit(src);
	}, [src]);

	return (
		<HStack>
			<Input
				placeholder="Image URL"
				value={urlToEdit}
				onChange={(evt) => {
					setUrlToEdit(evt.target.value);
				}}
			/>
			<Button
				onClick={() => {
					onUpdateUrl(urlToEdit);
				}}
			>
				Update
			</Button>
		</HStack>
	);
};
