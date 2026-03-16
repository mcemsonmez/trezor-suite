import { Locator, Page } from '@playwright/test';

import { TranslationKey } from '@suite/intl';

import { expect } from '../../../support/fixtures';
import { step } from '../../common';

export class DeviceTab {
    readonly createMultiShareBackupButton: Locator;
    readonly multiShareBackupGotItButton: Locator;
    private readonly firstInfoSubmitButton: Locator;
    private readonly secondInfoSubmitButton: Locator;
    readonly customFirmwareModalButton: Locator;
    readonly firmwareInstallButton: Locator;
    readonly firmwareInputArea: Locator;
    readonly firmwareConfirmSeedCheckbox: Locator;
    readonly firmwareConfirmSeedButton: Locator;
    readonly firmwareReconnectDevice: Locator;
    readonly autoconnectSwitch: Locator;
    readonly deviceForgetButton: Locator;
    readonly deviceForgetConfirmContent: Locator;
    readonly deviceForgetConfirmButton: Locator;
    readonly deviceForgetCancelButton: Locator;
    readonly deviceForgetIveRemovedItButton: Locator;
    readonly deviceForgetIveRemovedItTrezorButton: Locator;
    readonly deviceForgetModal: Locator;
    readonly deviceForgetHeader: Locator;
    readonly toastDeviceForgotten: Locator;
    readonly toastDeviceWillBeForgotten: Locator;

    constructor(private readonly page: Page) {
        this.createMultiShareBackupButton = page.getByTestId(
            '@settings/device/create-multi-share-backup-button',
        );
        this.multiShareBackupGotItButton = page.getByTestId(
            '@multi-share-backup/done/got-it-button',
        );
        this.firstInfoSubmitButton = page.getByTestId('@multi-share-backup/1st-info/submit-button');
        this.secondInfoSubmitButton = page.getByTestId(
            '@multi-share-backup/2nd-info/submit-button',
        );
        this.customFirmwareModalButton = page.getByTestId(
            '@settings/device/custom-firmware-modal-button',
        );
        this.firmwareInstallButton = page.getByTestId('@firmware/install-button');
        this.firmwareInputArea = page.getByTestId('@firmware/input-area');
        this.firmwareConfirmSeedCheckbox = page.getByTestId('@firmware/confirm-seed-checkbox');
        this.firmwareConfirmSeedButton = page.getByTestId('@firmware/confirm-seed-button');
        this.firmwareReconnectDevice = page.getByTestId('@firmware/reconnect-device');
        this.autoconnectSwitch = page.getByTestId('@settings/device/thp-autoconnect');
        this.deviceForgetButton = page.getByTestId('@settings/device/forget-button');
        this.deviceForgetConfirmButton = page.getByTestId('@settings/device/forget-button-confirm');
        this.deviceForgetConfirmContent = page.getByTestId(
            '@settings/device/forget/confirm-content',
        );
        this.deviceForgetCancelButton = page.getByTestId('@settings/device/forget-button-cancel');
        this.deviceForgetIveRemovedItButton = page.getByTestId(
            '@settings/device/ive-removed-it-button',
        );
        this.deviceForgetIveRemovedItTrezorButton = page.getByTestId(
            '@settings/device/ive-removed-it-button-trezor',
        );
        this.deviceForgetModal = page.getByTestId('@modal');
        this.deviceForgetHeader = page.getByTestId('@modal/header');
        this.toastDeviceForgotten = page.getByTestId('@toast/device-forgotten');
        this.toastDeviceWillBeForgotten = page.getByTestId('@toast/device-will-be-forgotten');
    }

    @step()
    async proceedMultiShareBackupModal(): Promise<void> {
        await this.page.getByTestId('@multi-share-backup/checkbox/1').click();
        await this.page.getByTestId('@multi-share-backup/checkbox/2').click();
        await this.firstInfoSubmitButton.click();
        await this.secondInfoSubmitButton.click();
    }

    @step()
    async openCustomFirmwareModal() {
        await this.customFirmwareModalButton.click();
        await expect(this.firmwareInstallButton).toBeDisabled();
    }

    @step()
    async selectCustomFirmware(filePath: string) {
        const fileChooserPromise = this.page.waitForEvent('filechooser');
        await this.firmwareInputArea.click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(filePath);
    }

    @step()
    async completeCustomFirmwareInstallation() {
        await this.firmwareInstallButton.click();
        await this.firmwareConfirmSeedCheckbox.click();
        await this.firmwareConfirmSeedButton.click();
    }

    @step()
    async completeBluetoothForgetFlow() {
        await this.deviceForgetIveRemovedItButton.click();
        await this.deviceForgetIveRemovedItTrezorButton.click();
    }

    @step()
    async verifyForgetDeviceModal(translation: TranslationKey) {
        await expect(this.deviceForgetModal).toBeVisible();
        await expect(this.deviceForgetHeader).toHaveTranslation(translation);
    }

    @step()
    async verifyForgetDeviceContent(translation: TranslationKey[]) {
        await expect(this.deviceForgetConfirmContent.locator('li')).toHaveTranslation(translation);
    }
}
