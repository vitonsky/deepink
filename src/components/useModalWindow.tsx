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
import { ModalContent, ModalOverlay } from '@chakra-ui/react';
import { WorkspaceModal } from '@features/App/Workspace/WorkspaceModal';
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

export type ModalWindowProviderProps = PropsWithChildren<{
	isVisible?: boolean;
}>;

export const ModalWindowProvider: FC<ModalWindowProviderProps> = ({
	isVisible = true,
	children,
}) => {
	const [context] = useState(() => ({
		show: createEvent<ModalWindowShowPayload>(),
	}));

	const [modalContexts, setModalContexts] = useState<ModalWindowShowPayload[]>([]);

	const modalContext = (modalContexts[0] ?? null) as ModalWindowShowPayload | null;
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
				<WorkspaceModal isOpen={isVisible} isCentered onClose={onClose}>
					<ModalOverlay />
					<modalWindowApiContext.Provider value={api}>
						<ModalContent>{modalContext.content(api)}</ModalContent>
					</modalWindowApiContext.Provider>
				</WorkspaceModal>
			)}
		</modalWindowContext.Provider>
	);
};
