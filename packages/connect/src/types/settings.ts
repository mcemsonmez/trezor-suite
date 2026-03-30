import type {
    ConnectSettings as CommonConnectSettings,
    ConnectSettingsPublic as CommonConnectSettingsPublic,
} from '@trezor/connect-common/src/types/settings';
import type { Transport } from '@trezor/transport';

// omit transports which are not implemented in @trezor/connect
type KnownTransport = Exclude<
    Transport['name'],
    'NativeUsbTransport' | 'BluetoothTransport' | 'NativeBluetoothTransport'
>;

export type ConnectSettingsTransport =
    | KnownTransport
    | Transport
    | (new (...args: any[]) => Transport);

export type ConnectSettingsPublic = Omit<CommonConnectSettingsPublic, 'transports'> & {
    transports?: ConnectSettingsTransport[];
};

export type ConnectSettings = Omit<CommonConnectSettings, 'transports'> & ConnectSettingsPublic;
