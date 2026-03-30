import { useDispatch, useSelector } from 'react-redux';

import { selectDeviceInternalModel, selectSelectedDevice } from '@suite-common/device';
import { submitPassphrase } from '@suite-common/wallet-core';
import { events } from '@suite-native/analytics';
import { Button } from '@suite-native/atoms';
import { selectPassphraseRequestId } from '@suite-native/device-authorization';
import { DeviceModelIcon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { useAnalytics } from '@suite-native/services';

export const EnterPassphraseOnTrezorButton = () => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const analytics = useAnalytics();
    const deviceModel = useSelector(selectDeviceInternalModel);
    const requestId = useSelector(selectPassphraseRequestId);

    const handleSubmitOnDevice = () => {
        analytics.report({ type: events.passphraseEnterOnTrezorEvent.name });
        if (!device) return;
        dispatch(submitPassphrase({ device, passphrase: '', passphraseOnDevice: true, requestId }));
    };

    if (!deviceModel || !device) return null;

    return (
        <Button
            onPress={handleSubmitOnDevice}
            colorScheme="tertiaryElevation0"
            viewLeft={<DeviceModelIcon deviceModel={deviceModel} />}
        >
            <Translation id="modulePassphrase.enterPassphraseOnTrezor.button" />
        </Button>
    );
};
