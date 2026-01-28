import { CONFIRM_CHANNEL_API } from './shared';

// Patch confirm: original window.confirm causes focus loss
export const patchWindowConfirm = () => {
	window.confirm = (message?: string) => (window as any)[CONFIRM_CHANNEL_API](message);
};
