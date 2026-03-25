import type { SelectAllLabelsForAccountParams } from '@suite-common/suite-sync';
import type { Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';

export const normalizeLabel = (label: string | undefined) => {
    const trimmedLabel = label?.trim();

    return trimmedLabel ? trimmedLabel : null;
};

export const createAccountLabelsParams = (account: Account): SelectAllLabelsForAccountParams => {
    const { walletDescriptor } = parseDeviceStaticSessionId(account.deviceState);

    return {
        walletDescriptor,
        accountDescriptor: account.descriptor,
        networkSymbol: account.symbol,
    };
};
