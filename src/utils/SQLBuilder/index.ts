import { PreparedValue } from './core/PreparedValue';
import { RawQuery } from './core/RawQuery';
import { RawValue } from './core/RawValue';

export type QuerySegment = RawValue | RawQuery | PreparedValue;

export type QuerySegmentOrPrimitive = QuerySegment | string | number;
