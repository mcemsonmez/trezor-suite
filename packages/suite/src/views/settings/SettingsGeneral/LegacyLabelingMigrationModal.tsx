import { useState } from 'react';

import { Translation } from '@suite/intl';
import {
    MetadataProviderSelectionModal,
    connectProvider,
    metadataLabelingActions,
    metadataThunks,
} from '@suite/metadata';
import { isTrezorDeviceWithState, selectDevices } from '@suite-common/device';
import { type MetadataProviderType } from '@suite-common/metadata-types';
import type { TrezorDevice, TrezorDeviceWithState } from '@suite-common/suite-types';
import { notificationsActions } from '@suite-common/toast-notifications';

import { suiteSyncErrorHandler } from 'src/components/suite/labeling/suiteSyncErrorHandler';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useSuiteServices } from 'src/support/SuiteServicesProvider';

const isConnectedMigratableDevice = (
    device: TrezorDevice | undefined,
): device is TrezorDeviceWithState =>
    isTrezorDeviceWithState(device) && device.connected && device.available;

type LegacyLabelingMigrationModalProps = {
    onCancel: () => void;
    onFinish: () => void;
};

export const LegacyLabelingMigrationModal = ({
    onCancel,
    onFinish,
}: LegacyLabelingMigrationModalProps) => {
    const dispatch = useDispatch();
    const { migrateLegacyLabelsToSuiteSync } = useSuiteServices();
    const [providerLoading, setProviderLoading] = useState<MetadataProviderType | null>(null);
    const [error, setError] = useState('');
    const devices = useSelector(selectDevices);
    const hasConnectedMigratableDevice = devices?.some(isConnectedMigratableDevice) ?? false;

    const handleMigrate = async (providerType: MetadataProviderType) => {
        if (!hasConnectedMigratableDevice) {
            setError('Connect device to continue.');

            return;
        }

        setError('');
        setProviderLoading(providerType);

        const providerConnected = await dispatch(connectProvider({ type: providerType }));

        if (providerConnected === 'window closed') {
            setProviderLoading(null);

            return;
        }

        if (typeof providerConnected === 'string') {
            setError(providerConnected);
            setProviderLoading(null);

            return;
        }

        if (!providerConnected) {
            setError('Migration failed. Try again.');
            setProviderLoading(null);

            return;
        }

        const migratableDevices = devices?.filter(isConnectedMigratableDevice) ?? [];

        for (const device of migratableDevices) {
            const deviceState = device.state.staticSessionId;

            const initialized = await dispatch(metadataLabelingActions.init(true, deviceState));

            if (!initialized) {
                setError('Migration failed. Try again.');
                setProviderLoading(null);

                return;
            }
        }

        const result = await migrateLegacyLabelsToSuiteSync();

        if (result.success) {
            dispatch(
                notificationsActions.addToast({
                    type: 'legacy-labeling-migration-success',
                    added: result.payload.changed,
                    skipped: result.payload.skipped,
                }),
            );

            onFinish();
            setProviderLoading(null);

            return;
        } else {
            suiteSyncErrorHandler({
                error: result.error.cause,
                dispatch,
                deviceStaticSessionId: result.error.deviceStaticSessionId,
            });

            setError('Migration failed. Try again.');
        }

        await dispatch(metadataThunks.disableMetadata());
        setProviderLoading(null);
    };

    return (
        <MetadataProviderSelectionModal
            onCancel={onCancel}
            onSelect={handleMigrate}
            isLoading={providerLoading ?? ''}
            isDisabled={!hasConnectedMigratableDevice}
            error={error || (!hasConnectedMigratableDevice ? 'Connect device to continue.' : '')}
            heading={<Translation id="TR_LABELING_MIGRATION_MODAL_HEADING" />}
            description={<Translation id="TR_LABELING_MIGRATION_MODAL_DESCRIPTION" />}
            testId="@modal/legacy-labeling-migration"
        />
    );
};
