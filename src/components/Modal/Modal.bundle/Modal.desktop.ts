import { withModModalRenderAll } from 'react-elegant-ui/esm/components/Modal/_renderAll/Modal_renderAll';
import { withModModalRenderToStack } from 'react-elegant-ui/esm/components/Modal/_renderToStack/Modal_renderToStack';
import { withModModalViewDefault } from 'react-elegant-ui/esm/components/Modal/_view/Modal_view_default@desktop';
import { Modal as BaseModal } from 'react-elegant-ui/esm/components/Modal/Modal';
import { compose, composeU } from 'react-elegant-ui/esm/lib/compose';

import { withModModalViewScreen } from '../_view/Modal_view_screen';

export const Modal = compose(
	composeU(withModModalViewDefault, withModModalViewScreen),
	withModModalRenderAll,
	withModModalRenderToStack,
)(BaseModal);

Modal.defaultProps = {
	view: 'default',
};
