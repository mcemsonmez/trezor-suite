import { NetworkSymbol } from '@suite-common/wallet-config';
import { TestCategory, TestPriority, TestStream, createTestAnnotation } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';

test.describe('Device Settings - Forget TS7', { tag: ['@T3W1'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test(
        'Confirm forget device flow for TS7',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that the TS7 device has been unpaired and forgotten successfully.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ settingsPage }) => {
            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
                await settingsPage.deviceTab.verifyForgetDeviceContent([
                    'TR_FORGET_DEVICE_MODAL_BULLET_FORGET',
                    'TR_FORGET_DEVICE_MODAL_BLUETOOTH_REMOVED_AND_DISCONNECTED',
                    'TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE',
                ]);
            });

            await test.step('Confirm device forgetting', async () => {
                await settingsPage.deviceTab.deviceForgetConfirmButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_FINISH_HEADING',
                );
            });

            await test.step('Complete the process by confirming Bluetooth removal', async () => {
                await settingsPage.deviceTab.completeBluetoothForgetFlow();

                await expect(settingsPage.deviceTab.toastDeviceForgotten).toHaveTranslation(
                    'TR_DEVICE_HAS_BEEN_FORGOTTEN',
                );
            });
        },
    );

    test(
        'Cancel forget device flow for TS7',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that the TS7 device "Forget" process has been cancelled successfully.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ settingsPage }) => {
            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
            });

            await test.step('Cancel the forget device modal', async () => {
                await settingsPage.deviceTab.deviceForgetCancelButton.click();

                await expect(settingsPage.deviceTab.deviceForgetModal).toBeHidden();
            });
        },
    );
});

test.describe('Device Settings - Forget TS5', { tag: ['@T3T1', '@smoke'] }, () => {
    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.navigateTo('device');
    });

    test(
        'Confirm forget device flow for TS5',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that the TS5 device has been unpaired and forgotten successfully.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ settingsPage }) => {
            await test.step('Forget device', async () => {
                await settingsPage.deviceTab.deviceForgetButton.click();

                await settingsPage.deviceTab.verifyForgetDeviceModal(
                    'TR_FORGET_DEVICE_MODAL_HEADING',
                );
                await settingsPage.deviceTab.verifyForgetDeviceContent([
                    'TR_FORGET_DEVICE_MODAL_BULLET_FORGET',
                    'TR_FORGET_DEVICE_MODAL_BULLET_NOT_WIPE',
                ]);
            });

            await test.step('Confirm device forgetting', async () => {
                await settingsPage.deviceTab.deviceForgetConfirmButton.click();

                await expect(settingsPage.deviceTab.toastDeviceWillBeForgotten).toHaveTranslation(
                    'TR_DEVICE_WILL_BE_FORGOTTEN',
                );
            });
        },
    );
});

test.describe('Device Settings - Forget TS7', { tag: ['@T3W1'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });

    test(
        'Forget button is disabled during discovery process',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that the "Forget" button is disabled during the discovery process and enabled once discovery finishes.',
                category: TestCategory.Device,
                priority: TestPriority.Low,
                stream: TestStream.Growth,
            }),
        },
        async ({ page, settingsPage }) => {
            const coins: NetworkSymbol[] = ['eth', 'ada', 'sol'];

            await test.step('Enable few coins', async () => {
                await settingsPage.navigateTo('coins');

                for (const coin of coins) {
                    await settingsPage.coinsTab.enableNetwork(coin);
                }

                await settingsPage.coinsTab.activateCoinsButton.click();
            });

            await test.step('Verify "Froget" button is disabled', async () => {
                await settingsPage.navigateTo('device');

                await expect(settingsPage.deviceTab.deviceForgetButton).toBeDisabled();
            });

            await test.step('Verify "Forget" button is enabled when discovery finished', async () => {
                await page.discoveryShouldFinish();

                await expect(settingsPage.deviceTab.deviceForgetButton).toBeEnabled();
            });
        },
    );
});
