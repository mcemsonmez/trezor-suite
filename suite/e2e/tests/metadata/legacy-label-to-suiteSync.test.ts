import { AccountLabelId } from '../../support/enums/accountLabelId';
import { expect, test } from '../../support/fixtures';
import { MetadataProvider } from '../../support/mocks/metadataMock';

const localLabel = 'local label';

test.describe('Labeling migration', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ wipeEvoluRelay: true });

    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding({ keepDebugModeEnabled: true });
    });

    test('Migration from local file', async ({ page, walletPage, metadataPage, devicePrompt }) => {
        await test.step('Set up local file labeling', async () => {
            await walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }).click();
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText('Bitcoin #1');

            // wait until account page is fully loaded
            await expect(walletPage.fiatAmount).toBeVisible();
            await metadataPage.account.clickEditLabelButton(AccountLabelId.BitcoinDefault1);
            await metadataPage.passThroughInitMetadata(MetadataProvider.LOCAL);
        });

        await test.step('Add legacy account label', async () => {
            await metadataPage.account.metadataInput.fill(localLabel);
            await page.keyboard.press('Enter');
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText(localLabel);
            await metadataPage.account.successIconIsVisible(AccountLabelId.BitcoinDefault1);
        });

        await test.step('Switch to Suite Sync labeling and confirm legacy label is migrated', async () => {
            await metadataPage.enableSuiteSync();
            await metadataPage.migrateLabelsButton.click();
            await metadataPage.migrateFromLocalFileButton.click();
            await devicePrompt.waitForPromptAndConfirm();
            await expect(
                walletPage.accountLabel({ symbol: 'btc', type: 'normal', atIndex: 0 }),
            ).toHaveText(localLabel);
        });
    });
});
