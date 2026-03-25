import { useEffect, useRef, useState } from 'react';

import { type DeviceRootState, selectDevices } from '@suite-common/device';
import {
    type SuiteSyncDataRootState,
    selectAllLabelsForAccount,
    selectSuiteSyncWalletLabel,
} from '@suite-common/suite-sync';
import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type EnsureWalletSuiteSyncOnErrors, type SuiteSync } from '@suite-common/suite-sync-types';
import { type Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Button } from '@trezor/components';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { type TimerId } from '@trezor/type-utils';

const WIPE_CONFIRM_DELAY_MS = 3_000;

export type WipeSuiteSyncLabelsState = DeviceRootState &
    SuiteSyncDataRootState & {
        wallet: {
            accounts: Account[];
        };
    };

type WipeSuiteSyncLabelsError = EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError;

export type WipeSuiteSyncLabelsOnError = (params: {
    deviceStaticSessionId: Account['deviceState'];
    error: WipeSuiteSyncLabelsError;
}) => void;

type WipeSuiteSyncLabelsProps = {
    onError: WipeSuiteSyncLabelsOnError;
    state: WipeSuiteSyncLabelsState;
    suiteSync: SuiteSync;
};

export const WipeSuiteSyncLabels = ({ onError, state, suiteSync }: WipeSuiteSyncLabelsProps) => {
    const [isWipeLoading, setIsWipeLoading] = useState(false);
    const [isWipeConfirmationArmed, setIsWipeConfirmationArmed] = useState(false);
    const [isWipeConfirmationLocked, setIsWipeConfirmationLocked] = useState(false);
    const [wipeConfirmationCountdown, setWipeConfirmationCountdown] = useState(0);
    const wipeConfirmationTimeoutRef = useRef<TimerId | null>(null);
    const wipeConfirmationIntervalRef = useRef<TimerId | null>(null);

    useEffect(
        () => () => {
            if (wipeConfirmationTimeoutRef.current !== null) {
                clearTimeout(wipeConfirmationTimeoutRef.current);
            }

            if (wipeConfirmationIntervalRef.current !== null) {
                clearInterval(wipeConfirmationIntervalRef.current);
            }
        },
        [],
    );

    const wipeAllSuiteSyncLabels = async () => {
        const devices = selectDevices(state);

        for (const device of devices) {
            if (!device.state?.staticSessionId) {
                continue;
            }

            const { walletDescriptor } = parseDeviceStaticSessionId(device.state.staticSessionId);
            const walletLabel = selectSuiteSyncWalletLabel(state, walletDescriptor);

            if (walletLabel === null) {
                continue;
            }

            const walletResult = await suiteSync.labeling.updateWalletLabel({
                deviceStaticSessionId: device.state.staticSessionId,
                label: null,
            });

            if (!walletResult.success) {
                onError({
                    error: walletResult.error,
                    deviceStaticSessionId: device.state.staticSessionId,
                });

                return;
            }
        }

        for (const account of state.wallet.accounts) {
            const { walletDescriptor } = parseDeviceStaticSessionId(account.deviceState);
            const labels = selectAllLabelsForAccount(state, {
                walletDescriptor,
                accountDescriptor: account.descriptor,
                networkSymbol: account.symbol,
            });

            if (labels.accountLabel !== null) {
                const accountResult = await suiteSync.labeling.updateAccountLabel({
                    deviceStaticSessionId: account.deviceState,
                    accountKey: account.key,
                    label: null,
                });

                if (!accountResult.success) {
                    onError({
                        error: accountResult.error,
                        deviceStaticSessionId: account.deviceState,
                    });

                    return;
                }
            }

            for (const addressLabel of labels.addressLabels) {
                if (addressLabel.label === null) {
                    continue;
                }

                const addressResult = await suiteSync.labeling.updateAddressLabel({
                    deviceStaticSessionId: account.deviceState,
                    address: addressLabel.address,
                    label: null,
                    accountDescriptor: account.descriptor,
                    networkSymbol: account.symbol,
                });

                if (!addressResult.success) {
                    onError({
                        error: addressResult.error,
                        deviceStaticSessionId: account.deviceState,
                    });

                    return;
                }
            }

            for (const outputLabel of labels.outputLabels) {
                if (outputLabel.label === null) {
                    continue;
                }

                const outputResult = await suiteSync.labeling.updateOutputLabel({
                    deviceStaticSessionId: account.deviceState,
                    txId: outputLabel.txId,
                    txTargetId: outputLabel.txTargetId,
                    label: null,
                    accountDescriptor: account.descriptor,
                    networkSymbol: account.symbol,
                });

                if (!outputResult.success) {
                    onError({
                        error: outputResult.error,
                        deviceStaticSessionId: account.deviceState,
                    });

                    return;
                }
            }
        }
    };

    const handleWipeButtonClick = async () => {
        if (!isWipeConfirmationArmed) {
            setIsWipeConfirmationArmed(true);
            setIsWipeConfirmationLocked(true);
            setWipeConfirmationCountdown(Math.ceil(WIPE_CONFIRM_DELAY_MS / 1_000));

            if (wipeConfirmationTimeoutRef.current !== null) {
                clearTimeout(wipeConfirmationTimeoutRef.current);
            }

            if (wipeConfirmationIntervalRef.current !== null) {
                clearInterval(wipeConfirmationIntervalRef.current);
            }

            wipeConfirmationIntervalRef.current = setInterval(() => {
                setWipeConfirmationCountdown(countdown => Math.max(countdown - 1, 0));
            }, 1_000);

            wipeConfirmationTimeoutRef.current = setTimeout(() => {
                setIsWipeConfirmationLocked(false);
                setWipeConfirmationCountdown(0);

                if (wipeConfirmationIntervalRef.current !== null) {
                    clearInterval(wipeConfirmationIntervalRef.current);
                    wipeConfirmationIntervalRef.current = null;
                }
            }, WIPE_CONFIRM_DELAY_MS);

            return;
        }

        setIsWipeLoading(true);

        await wipeAllSuiteSyncLabels();

        setIsWipeLoading(false);
        setIsWipeConfirmationArmed(false);
        setIsWipeConfirmationLocked(false);
        setWipeConfirmationCountdown(0);

        if (wipeConfirmationIntervalRef.current !== null) {
            clearInterval(wipeConfirmationIntervalRef.current);
            wipeConfirmationIntervalRef.current = null;
        }
    };

    let buttonLabel = 'Wipe labels';

    if (isWipeLoading) {
        buttonLabel = 'Wiping labels...';
    } else if (isWipeConfirmationLocked) {
        buttonLabel = `Are you sure? (${wipeConfirmationCountdown}s)`;
    } else if (isWipeConfirmationArmed) {
        buttonLabel = 'Confirm deletion';
    }

    return (
        <SectionItem>
            <TextColumn
                title="Wipe Suite Sync labels"
                description="Sets all current Suite Sync wallet, account, address, and output labels to null."
            />
            <ActionColumn>
                <Button
                    data-testid="@settings/debug/suite-sync/wipe-labels-button"
                    intent="critical"
                    isLoading={isWipeLoading}
                    isDisabled={isWipeLoading || isWipeConfirmationLocked}
                    size="small"
                    onClick={handleWipeButtonClick}
                >
                    {buttonLabel}
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
