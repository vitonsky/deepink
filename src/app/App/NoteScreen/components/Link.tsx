import React, { useCallback } from 'react';
import { Components } from 'react-markdown';


export const Link: Exclude<Components['a'], undefined> = (props) => {
	const onClick = useCallback((evt: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		if (props.onClick) {
			props.onClick(evt);
		}

		if (evt.isDefaultPrevented() || evt.isPropagationStopped()) return;
		if (evt.type !== 'click' || !props.href || !(/^https?:\/\//).test(props.href)) return;

		evt.preventDefault();

		// TODO: implement open external resource
		// require("shell").openExternal(props.href);
		console.log('Open external resource', props.href);
	}, [props]);

	return <a {...props} target={props.target ?? '_blank'} onClick={onClick} />;
};