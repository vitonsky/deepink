import { useEffect } from 'react';
import ms from 'ms';
import { useAppSelector } from '@state/redux/hooks';
import { selectVaultLockConfig } from '@state/redux/settings/selectors/preferences';

import { useProfileControls } from '..';

export const useAutoLock = () => {
	const {
		close: closeVault,
		profile: {
			profile: { isEncrypted },
		},
	} = useProfileControls();
	const { lockAfterIdle } = useAppSelector(selectVaultLockConfig);

	// Lock after idle
	useEffect(() => {
		if (!isEncrypted || !lockAfterIdle) return;

		if (lockAfterIdle < ms('1m') || lockAfterIdle > ms('48h')) {
			console.warn(
				'Auto lock by timeout is force disabled because idle time have no sense',
				lockAfterIdle,
			);
			return;
		}

		console.debug(
			`Auto lock is enabled. Vault will be locked after ${ms(lockAfterIdle)} inactivity`,
		);

		let lockTimer: number | null = null;
		const markActive = (): void => {
			if (lockTimer !== null) {
				window.clearTimeout(lockTimer);
			}

			lockTimer = window.setTimeout(closeVault, lockAfterIdle);
		};

		const events: (keyof DocumentEventMap)[] = [
			'keydown',
			'keyup',
			'pointerdown',
			'pointermove',
			'pointerup',
			'wheel',
			'focus',
			'visibilitychange',
		];

		for (const event of events) {
			document.addEventListener(event, markActive, { passive: true });
		}

		markActive();

		return (): void => {
			if (lockTimer !== null) {
				window.clearTimeout(lockTimer);
			}

			for (const event of events) {
				document.removeEventListener(event, markActive);
			}
		};
	}, [closeVault, isEncrypted, lockAfterIdle]);
};
