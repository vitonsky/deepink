import React, {
	createContext,
	FC,
	PropsWithChildren,
	ReactNode,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { createEvent, EventCallable } from 'effector';
import { Modal, ModalContent, ModalOverlay } from '@chakra-ui/react';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export type ModalWindowApi = { onClose: () => void };

export type ModalWindowShowPayload = {
	onClose?: () => void;
	content: (props: ModalWindowApi) => ReactNode;
};

const modalWindowContext = createContext<{
	show: EventCallable<ModalWindowShowPayload>;
}>(null as any);
export const useModalWindow = createContextGetterHook(modalWindowContext);

const modalWindowApiContext = createContext<ModalWindowApi>(null as any);
export const useModalWindowApi = createContextGetterHook(modalWindowApiContext);

export const ModalWindowProvider: FC<PropsWithChildren> = ({ children }) => {
	const [context] = useState(() => ({
		show: createEvent<ModalWindowShowPayload>(),
	}));

	const [modalContexts, setModalContexts] = useState<ModalWindowShowPayload[]>([]);

	const modalContext = modalContexts[0] ?? null;
	const onClose = useCallback(() => {
		if (!modalContext) return;

		if (modalContext.onClose) {
			modalContext.onClose();
		}

		setModalContexts(([_payload, ...payloads]) => [...payloads]);
	}, [modalContext]);

	useEffect(() => {
		const { show } = context;

		const cleanups = [
			show.watch((payload) => {
				setModalContexts((payloads) => [payload, ...payloads]);
			}),
		];

		return () => {
			cleanups.forEach((cleanup) => cleanup());
		};
	});

	const api = { onClose };

	return (
		<modalWindowContext.Provider value={context}>
			{children}
			{modalContext && (
				<Modal isOpen isCentered onClose={onClose}>
					<ModalOverlay />
					<modalWindowApiContext.Provider value={api}>
						<ModalContent>{modalContext.content(api)}</ModalContent>
					</modalWindowApiContext.Provider>
				</Modal>
			)}
		</modalWindowContext.Provider>
	);
};
