import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe('Onboarding - create wallet', { tag: ['@T3W1'] }, () => {
    test.use({ setupEmulator: false });
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'Success (Shamir backup)',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verify that a user can successfully create a wallet during the onboarding process.',
                category: TestCategory.Onboarding,
                priority: TestPriority.Critical,
            }),
        },
        async ({ page, device, onboardingPage, devicePrompt, analyticsSection, dashboardPage }) => {
            await onboardingPage.optionallyDismissFwHashCheckError();
            await analyticsSection.continueButton.click();
            await devicePrompt.allowConnectToTrezor();
            await onboardingPage.enterTHPPairingCode();
            await page.getByTestId('@analytics/continue-button').click();
            await onboardingPage.firmware.continueThroughFirmware();
            await page.waitForTimeout(500);
            await onboardingPage.tutorial.skip();

            // Create wallet with Shamir backup
            await onboardingPage.createWalletButton.click();
            await onboardingPage.selectSeedType('shamir-advanced');

            // Accept ToS
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();

            // Confirm wallet created
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();

            await onboardingPage.createBackupButton.click();

            // Create backup with Shamir shares and threshold
            const shares = 3;
            const threshold = 2;

            await onboardingPage.backup.passThroughShamirBackup(shares, threshold);

            // Set PIN
            await onboardingPage.pin.setPinButton.click();
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();
            // method is used as a workaround to setup PIN with value 12
            await device.selectNumberOfWords(12);
            await device.selectNumberOfWords(12);
            await devicePrompt.confirmOnDevicePromptIsShown();
            await device.pressYes();

            await test.step('Finish wallet creation', async () => {
                await expect(onboardingPage.suiteLoadedIndicator).toBeVisible();
                await expect(dashboardPage.walletReady).toBeVisible();
            });
        },
    );
});
