import type { UnknownAction } from '@reduxjs/toolkit';

import { mockNotExpected } from '@suite-common/dependency-injection';
import { type SuiteSyncStorage } from '@suite-common/suite-sync-storage';
import { type StaticSessionId } from '@trezor/connect';

import { setSuiteSyncServerUrl } from '../../suiteSyncSlice';
import { type ChangeRelayUrlDeps, createChangeRelayUrl } from '../createChangeRelayUrl';
import { DEFAULT_SUITE_SYNC_RELAY_URL } from '../relayUrl';

const deviceStaticSessionId: StaticSessionId = '1@2:3';

const createDeps = (): {
    deps: ChangeRelayUrlDeps;
    actions: UnknownAction[];
    mockStorage: SuiteSyncStorage;
} => {
    const actions: UnknownAction[] = [];

    const mockStorage: SuiteSyncStorage = {
        data: {
            accounts: {} as any,
            addresses: {} as any,
            outputs: {} as any,
            wallets: {} as any,
        },
        dispose: mockNotExpected('dispose'),
        updateRelayUrl: jest.fn(),
    };

    const deps: ChangeRelayUrlDeps = {
        getAllDeviceSessionIds: () => [deviceStaticSessionId],
        dispatch: (action: any) => actions.push(action),
        suiteSyncStorageRepository: {
            delete: mockNotExpected('delete'),
            get: jest.fn(() => mockStorage),
            set: mockNotExpected('set'),
        },
    };

    return { deps, actions, mockStorage };
};

describe(createChangeRelayUrl.name, () => {
    it('dispatches custom relay for non-default URL', () => {
        const { deps, actions, mockStorage } = createDeps();

        const changeRelayUrl = createChangeRelayUrl(deps);
        changeRelayUrl({ relayUrl: 'http://localhost:4000' });

        expect(actions).toStrictEqual([
            {
                payload: { type: 'custom', customUrl: 'http://localhost:4000' },
                type: setSuiteSyncServerUrl.type,
            },
        ]);

        expect(deps.suiteSyncStorageRepository.get).toHaveBeenCalledWith('1'); // <--- "1" is the WalletDescriptor
        expect(mockStorage.updateRelayUrl).toHaveBeenCalledWith('http://localhost:4000');
    });

    it('dispatches default relay for Trezor server URL', () => {
        const { deps, actions, mockStorage } = createDeps();

        const changeRelayUrl = createChangeRelayUrl(deps);
        changeRelayUrl({ relayUrl: DEFAULT_SUITE_SYNC_RELAY_URL });

        expect(actions).toStrictEqual([
            {
                payload: { type: 'default', customUrl: null },
                type: setSuiteSyncServerUrl.type,
            },
        ]);

        expect(mockStorage.updateRelayUrl).toHaveBeenCalledWith(DEFAULT_SUITE_SYNC_RELAY_URL);
    });

    it('dispatches default relay for null URL', () => {
        const { deps, actions, mockStorage } = createDeps();

        const changeRelayUrl = createChangeRelayUrl(deps);
        changeRelayUrl({ relayUrl: null });

        expect(actions).toStrictEqual([
            {
                payload: { type: 'default', customUrl: null },
                type: setSuiteSyncServerUrl.type,
            },
        ]);

        expect(mockStorage.updateRelayUrl).toHaveBeenCalledWith(DEFAULT_SUITE_SYNC_RELAY_URL);
    });
});
