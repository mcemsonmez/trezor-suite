import type { CoreCallMessage } from '@trezor/connect-common';
import { TypedError } from '@trezor/connect-common/src/constants/errors';
import type { ModuleName } from '@trezor/connect-common/src/constants/network';
import { MODULES } from '@trezor/connect-common/src/constants/network';

import * as Methods from '../api';
import type { MethodContext } from './AbstractMethod';

const moduleMethods = {
    cardano: {
        cardanoComposeTransaction: require('../api/cardano/api/cardanoComposeTransaction').default,
        cardanoGetAddress: require('../api/cardano/api/cardanoGetAddress').default,
        cardanoGetNativeScriptHash: require('../api/cardano/api/cardanoGetNativeScriptHash')
            .default,
        cardanoGetPublicKey: require('../api/cardano/api/cardanoGetPublicKey').default,
        cardanoSignMessage: require('../api/cardano/api/cardanoSignMessage').default,
        cardanoSignTransaction: require('../api/cardano/api/cardanoSignTransaction').default,
    },
    ethereum: {
        ethereumGetAddress: require('../api/ethereum/api/ethereumGetAddress').default,
        ethereumGetPublicKey: require('../api/ethereum/api/ethereumGetPublicKey').default,
        ethereumSignMessage: require('../api/ethereum/api/ethereumSignMessage').default,
        ethereumSignTransaction: require('../api/ethereum/api/ethereumSignTransaction').default,
        ethereumSignTypedData: require('../api/ethereum/api/ethereumSignTypedData').default,
        ethereumVerifyMessage: require('../api/ethereum/api/ethereumVerifyMessage').default,
    },
    monero: {
        moneroGetAddress: require('../api/monero/api/moneroGetAddress').default,
        moneroGetWatchKey: require('../api/monero/api/moneroGetWatchKey').default,
        moneroKeyImageSync: require('../api/monero/api/moneroKeyImageSync').default,
        moneroSignTransaction: require('../api/monero/api/moneroSignTransaction').default,
    },
    ripple: {
        rippleGetAddress: require('../api/ripple/api/rippleGetAddress').default,
        rippleSignTransaction: require('../api/ripple/api/rippleSignTransaction').default,
    },
    solana: {
        solanaComposeTransaction: require('../api/solana/api/solanaComposeTransaction').default,
        solanaGetAddress: require('../api/solana/api/solanaGetAddress').default,
        solanaGetPublicKey: require('../api/solana/api/solanaGetPublicKey').default,
        solanaSignTransaction: require('../api/solana/api/solanaSignTransaction').default,
    },
    stellar: {
        stellarGetAddress: require('../api/stellar/api/stellarGetAddress').default,
        stellarSignTransaction: require('../api/stellar/api/stellarSignTransaction').default,
    },
    tezos: {
        tezosGetAddress: require('../api/tezos/api/tezosGetAddress').default,
        tezosGetPublicKey: require('../api/tezos/api/tezosGetPublicKey').default,
        tezosSignTransaction: require('../api/tezos/api/tezosSignTransaction').default,
    },
    tron: {
        tronGetAddress: require('../api/tron/api/tronGetAddress').default,
        tronSignTransaction: require('../api/tron/api/tronSignTransaction').default,
    },
} as const satisfies Record<ModuleName, any>;

const getMethodModule = (method: CoreCallMessage['payload']['method']) =>
    MODULES.find(module => method.startsWith(module));

// eslint-disable-next-line require-await
export const getMethod = async (message: CoreCallMessage, context: MethodContext) => {
    const { method } = message.payload;
    if (typeof method !== 'string') {
        throw TypedError('Method_InvalidParameter', 'Message method is not set');
    }

    const methodModule = getMethodModule(method);
    const methods = methodModule ? moduleMethods[methodModule] : Methods;
    const MethodConstructor = (methods as Record<string, any>)[method];

    if (MethodConstructor) {
        return new MethodConstructor({ ...message, ...context } as any);
    }

    throw TypedError('Method_InvalidParameter', `Method ${method} not found`);
};
