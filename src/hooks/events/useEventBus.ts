import { createContext } from 'react';
import { EventBus } from '@api/events/EventBus';
import { GlobalEventsPayloadMap } from '@api/events/global';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const GlobalEventBusContext =
	createContext<EventBus<GlobalEventsPayloadMap> | null>(null);

export const useEventBus = createContextGetterHook(GlobalEventBusContext);
