import { createContext } from 'react';
import { TelemetryTracker } from '@core/features/telemetry/Telemetry';
import { createContextGetterHook } from '@utils/react/createContextGetterHook';

export const TelemetryContext = createContext<TelemetryTracker | null>(null);
export const useTelemetryTracker = createContextGetterHook(TelemetryContext);
