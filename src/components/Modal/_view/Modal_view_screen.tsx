import { cnModal } from 'react-elegant-ui/esm/components/Modal/Modal';
import { withClassnameHOC } from 'react-elegant-ui/esm/lib/compose';

import './Modal_view_screen.css';

export interface IModViewScreen {
	view?: 'screen';
}

export const withModModalViewScreen = withClassnameHOC<IModViewScreen>(cnModal(), {
	view: 'screen',
});
