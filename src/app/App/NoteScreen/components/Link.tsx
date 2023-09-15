import React, { useCallback } from 'react';
import { Components } from 'react-markdown';
import saveAs from 'file-saver';

import { getAppResourceDataInUrl } from '../../../../core/links';
import { openLink } from '../../../../electron/requests/interactions/renderer';
import { useFilesRegistry } from '../../Providers';

export const Link: Exclude<Components['a'], undefined> = ({
	node,
	sourcePosition,
	...props
}) => {
	const filesRegistry = useFilesRegistry();

	const onClick = useCallback(
		(evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
			if (props.onClick) {
				props.onClick(evt);
			}

			if (evt.isDefaultPrevented() || evt.isPropagationStopped()) return;

			const url = props.href;
			if (evt.type !== 'click' || !url) return;

			const resourceData = getAppResourceDataInUrl(url);

			if (resourceData) {
				switch (resourceData.type) {
					case 'resource': {
						// Save resources
						const fileId = resourceData.id;
						console.log({ fileId, url });
						if (fileId !== null) {
							evt.preventDefault();

							filesRegistry.get(fileId).then(async (file) => {
								if (!file) return;

								const buffer = await file.arrayBuffer();
								saveAs(new Blob([buffer]), file.name);
							});

							return;
						}
						break;
					}
					case 'note': {
						evt.preventDefault();

						// TODO: implement logic to open note
						console.warn(`Open note`, resourceData.id);
						return;
					}
				}
			}

			// Open urls
			if (/^https?:\/\//.test(url)) {
				evt.preventDefault();

				openLink(url);

				return;
			}
		},
		[filesRegistry, props],
	);

	return <a {...props} target={props.target ?? '_blank'} onClick={onClick} />;
};
