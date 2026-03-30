import type { ThpPairingMethod } from '@trezor/protocol';

import type { LocalFirmwares } from '../settings';

export const UI_RESPONSE = {
    RECEIVE_CONFIRMATION: 'ui-receive_confirmation',
    RECEIVE_FIRMWARE: 'ui-receive_firmware',
    RECEIVE_PIN: 'ui-receive_pin',
    RECEIVE_PASSPHRASE: 'ui-receive_passphrase',
    RECEIVE_THP_PAIRING_TAG: 'ui-receive_thp_pairing_tag',
    RECEIVE_ACCOUNT: 'ui-receive_account',
    RECEIVE_FEE: 'ui-receive_fee',
    RECEIVE_WORD: 'ui-receive_word',
} as const;

export type UiResponseConfirmation = {
    type: typeof UI_RESPONSE.RECEIVE_CONFIRMATION;
    payload: boolean;
};

export type UiResponseFirmwares = {
    type: typeof UI_RESPONSE.RECEIVE_FIRMWARE;
    payload: LocalFirmwares;
};

export type UiResponsePin = {
    type: typeof UI_RESPONSE.RECEIVE_PIN;
    payload: string;
};

export type UiResponseWord = {
    type: typeof UI_RESPONSE.RECEIVE_WORD;
    payload: string;
};

export type UiResponsePassphrase = {
    type: typeof UI_RESPONSE.RECEIVE_PASSPHRASE;
    payload: {
        value: string;
        passphraseOnDevice?: boolean;
        save?: boolean;
    };
};

export type UiResponseThpPairingTag = {
    type: typeof UI_RESPONSE.RECEIVE_THP_PAIRING_TAG;
    payload:
        | {
              tag: string;
          }
        | {
              selectedMethod: ThpPairingMethod | keyof typeof ThpPairingMethod;
          };
};

export type UiResponseAccount = {
    type: typeof UI_RESPONSE.RECEIVE_ACCOUNT;
    payload: number;
};

export type UiResponseFee = {
    type: typeof UI_RESPONSE.RECEIVE_FEE;
    payload:
        | {
              type: 'compose-custom';
              value: string;
          }
        | {
              type: 'change-account';
          }
        | {
              type: 'send';
              value: string;
          };
};

export type UiResponseEvent =
    | UiResponseConfirmation
    | UiResponsePin
    | UiResponseWord
    | UiResponsePassphrase
    | UiResponseThpPairingTag
    | UiResponseAccount
    | UiResponseFee
    | UiResponseFirmwares;

export declare function uiResponse(response: UiResponseEvent): void;
