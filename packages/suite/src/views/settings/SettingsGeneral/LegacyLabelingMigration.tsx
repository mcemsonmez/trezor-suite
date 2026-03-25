import { useState } from 'react';

import { Translation } from '@suite/intl';
import { SettingsAnchor } from '@suite/router';
import { isTrezorDeviceWithState, selectDevices } from '@suite-common/device';
import { selectIsSuiteSyncEnabled } from '@suite-common/suite-sync';
import type { TrezorDeviceWithState } from '@suite-common/suite-types';
import { Tooltip } from '@trezor/components';
import { ActionButton, ActionColumn, TextColumn } from '@trezor/product-components';

import { SettingsSectionItem } from 'src/components/settings/SettingsSectionItem';
import { useSelector } from 'src/hooks/suite';

import { LegacyLabelingMigrationModal } from './LegacyLabelingMigrationModal';

const isConnectedMigratableDevice = (
    device: ReturnType<typeof selectDevices>[number],
): device is TrezorDeviceWithState =>
    isTrezorDeviceWithState(device) && device.connected && device.available;

export const LegacyLabelingMigration = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const devices = useSelector(selectDevices);

    const hasConnectedMigratableDevice = devices?.some(isConnectedMigratableDevice) ?? false;

    if (!isSuiteSyncEnabled) {
        return null;
    }

    return (
        <>
            {isModalVisible && (
                <LegacyLabelingMigrationModal
                    onCancel={() => setIsModalVisible(false)}
                    onFinish={() => setIsModalVisible(false)}
                />
            )}

            <SettingsSectionItem anchorId={SettingsAnchor.LabelingMigration}>
                <TextColumn
                    title={<Translation id="TR_LABELING_MIGRATION_TITLE" />}
                    description={<Translation id="TR_LABELING_MIGRATION_DESCRIPTION" />}
                />
                <ActionColumn>
                    <Tooltip
                        content={
                            hasConnectedMigratableDevice ? undefined : (
                                <Translation id="TR_DEVICE_NOT_CONNECTED" />
                            )
                        }
                    >
                        <ActionButton
                            intent="brand"
                            onClick={() => setIsModalVisible(true)}
                            isDisabled={!hasConnectedMigratableDevice}
                            data-testid="@settings/metadata/migrate-button"
                        >
                            <Translation id="TR_MIGRATE" />
                        </ActionButton>
                    </Tooltip>
                </ActionColumn>
            </SettingsSectionItem>
        </>
    );
};
