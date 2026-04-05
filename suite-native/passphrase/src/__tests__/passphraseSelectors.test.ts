import { type DeviceRootState } from '@suite-common/device';
import { type DiscoveryRootState } from '@suite-common/wallet-core';
import { type DeviceUniquePath } from '@trezor/connect';

import {
    isPassphraseDiscoveryFailure,
    selectHasNewHiddenWalletFailed,
    selectHasPassphraseError,
    selectHasVerificationCancelledError,
    selectIsCreatingNewPassphraseWallet,
    selectPassphraseDiscoveryCompleted,
} from '../passphraseSelectors';

const TEST_DEVICE_PATH = 'device-id:1' as DeviceUniquePath;

const createState = (
    discoveryOverrides: Record<string, unknown> = {},
): DiscoveryRootState & DeviceRootState =>
    ({
        device: {
            selectedDevice: { path: TEST_DEVICE_PATH },
        },
        wallet: {
            discovery: {
                [TEST_DEVICE_PATH]: {
                    status: 'starting',
                    startTimestamp: 1000,
                    ...discoveryOverrides,
                },
            },
        },
    }) as unknown as DiscoveryRootState & DeviceRootState;

describe('passphraseSelectors', () => {
    describe('isPassphraseDiscoveryFailure', () => {
        it('returns false for undefined', () => {
            expect(isPassphraseDiscoveryFailure(undefined)).toBe(false);
        });

        it('returns true for cancelled status', () => {
            expect(isPassphraseDiscoveryFailure({ status: 'cancelled' })).toBe(true);
        });

        it('returns true for passphrase-mismatch status', () => {
            expect(isPassphraseDiscoveryFailure({ status: 'passphrase-mismatch' })).toBe(true);
        });

        it('returns true for failed with Method_Interrupted', () => {
            expect(
                isPassphraseDiscoveryFailure({ status: 'failed', errorCode: 'Method_Interrupted' }),
            ).toBe(true);
        });

        it('returns true for failed with Passphrase is incorrect', () => {
            expect(
                isPassphraseDiscoveryFailure({
                    status: 'failed',
                    error: 'Passphrase is incorrect',
                }),
            ).toBe(true);
        });

        it('returns false for progress status', () => {
            expect(isPassphraseDiscoveryFailure({ status: 'progress' })).toBe(false);
        });

        it('returns false for failed with unrelated error', () => {
            expect(
                isPassphraseDiscoveryFailure({ status: 'failed', error: 'Connection error' }),
            ).toBe(false);
        });
    });

    describe('selectHasVerificationCancelledError', () => {
        it('returns true when discovery status is cancelled', () => {
            const state = createState({ status: 'cancelled' });
            expect(selectHasVerificationCancelledError(state)).toBe(true);
        });

        it('returns false when discovery status is failed', () => {
            const state = createState({ status: 'failed' });
            expect(selectHasVerificationCancelledError(state)).toBe(false);
        });
    });

    describe('selectHasPassphraseError', () => {
        it('returns true when adding existing wallet and status is failed', () => {
            const state = createState({ status: 'failed', isAddingExistingWallet: true });
            expect(selectHasPassphraseError(state)).toBeTruthy();
        });

        it('returns true when adding existing wallet and status is cancelled', () => {
            const state = createState({ status: 'cancelled', isAddingExistingWallet: true });
            expect(selectHasPassphraseError(state)).toBeTruthy();
        });

        it('returns false when adding NEW hidden wallet and status is failed', () => {
            // selectHasPassphraseError only covers existing wallet reconnection — not new wallet creation
            const state = createState({
                status: 'failed',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: false,
            });
            expect(selectHasPassphraseError(state)).toBeFalsy();
        });
    });

    describe('selectHasNewHiddenWalletFailed', () => {
        it('returns true when adding new hidden wallet and status is failed', () => {
            const state = createState({
                status: 'failed',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: false,
            });
            expect(selectHasNewHiddenWalletFailed(state)).toBeTruthy();
        });

        it('returns true when adding new hidden wallet and status is cancelled', () => {
            const state = createState({
                status: 'cancelled',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: false,
            });
            expect(selectHasNewHiddenWalletFailed(state)).toBeTruthy();
        });

        it('returns false when adding existing wallet (even if failed)', () => {
            const state = createState({
                status: 'failed',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: true,
            });
            expect(selectHasNewHiddenWalletFailed(state)).toBeFalsy();
        });

        it('returns false when not adding hidden wallet', () => {
            const state = createState({ status: 'failed', isAddingHiddenWallet: false });
            expect(selectHasNewHiddenWalletFailed(state)).toBeFalsy();
        });

        it('returns false when status is progress', () => {
            const state = createState({
                status: 'progress',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: false,
            });
            expect(selectHasNewHiddenWalletFailed(state)).toBeFalsy();
        });

        it('returns false when status is complete', () => {
            const state = createState({
                status: 'complete',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: false,
            });
            expect(selectHasNewHiddenWalletFailed(state)).toBeFalsy();
        });
    });

    describe('selectIsCreatingNewPassphraseWallet', () => {
        it('returns true when isAddingHiddenWallet is true', () => {
            const state = createState({ isAddingHiddenWallet: true });
            expect(selectIsCreatingNewPassphraseWallet(state)).toBe(true);
        });

        it('returns undefined when isAddingHiddenWallet is not set', () => {
            const state = createState({});
            expect(selectIsCreatingNewPassphraseWallet(state)).toBeUndefined();
        });
    });

    describe('selectPassphraseDiscoveryCompleted', () => {
        it('returns true when status is complete and isAddingHiddenWallet', () => {
            const state = createState({ status: 'complete', isAddingHiddenWallet: true });
            expect(selectPassphraseDiscoveryCompleted(state)).toBe(true);
        });

        it('returns true when status is progress with non-empty account and isAddingHiddenWallet', () => {
            const state = createState({
                status: 'progress',
                isAddingHiddenWallet: true,
                hasLoadedAnyNonEmptyAccount: true,
            });
            expect(selectPassphraseDiscoveryCompleted(state)).toBe(true);
        });

        it('returns null when not adding hidden wallet', () => {
            const state = createState({ status: 'complete', isAddingHiddenWallet: false });
            expect(selectPassphraseDiscoveryCompleted(state)).toBeNull();
        });
    });

    describe('PIN cancel during passphrase open flow (regression #15733)', () => {
        it('selectHasNewHiddenWalletFailed detects cancelled state produced by PIN cancel fix', () => {
            // With the fix, Failure_PinCancelled is now in DEVICE_CANCELLATION_CODES,
            // so discovery status is set to 'cancelled' instead of 'failed'.
            // This selector must detect it so the redirect fires.
            const stateAfterFix = createState({
                status: 'cancelled',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: false,
            });
            expect(selectHasNewHiddenWalletFailed(stateAfterFix)).toBeTruthy();
            expect(selectHasVerificationCancelledError(stateAfterFix)).toBe(true);
        });

        it('defense-in-depth: detects failed state in case primary fix were missing', () => {
            // Even without the primary DEVICE_CANCELLATION_CODES fix, the defense-in-depth
            // selector catches the 'failed' status for new hidden wallet creation.
            const stateWithoutPrimaryFix = createState({
                status: 'failed',
                isAddingHiddenWallet: true,
                isAddingExistingWallet: false,
                error: 'PIN cancelled',
                errorCode: 'Failure_PinCancelled',
            });
            expect(selectHasNewHiddenWalletFailed(stateWithoutPrimaryFix)).toBeTruthy();
        });
    });
});
