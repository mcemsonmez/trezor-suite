import { cryptoIdToSymbol } from '@suite-common/trading';
import { localizeNumber } from '@suite-common/wallet-utils';

import { invityEndpoint } from '../../fixtures/invity';
import { SEEDED_TRADES } from '../../fixtures/invity/swap/swap-history';
import { expect, test } from '../../support/fixtures';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Trading - Swap history', { tag: ['@webOnly', '@T3T1', '@T3W1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_academic' } });

    test.beforeEach(async ({ page, onboardingPage, settingsPage, tradingStore }) => {
        // The app periodically calls `/exchange/watch/*` to refresh trade status.
        // For this test we keep status stable by echoing the current status from
        // the request body, so seeded `CONFIRMING` remains `Pending` in UI.
        await page.route(invityEndpoint.swapWatch, async route => {
            const body = route.request().postDataJSON() as { status?: string } | null;
            await route.fulfill({ json: { status: body?.status ?? 'SUCCESS' } });
        });

        await onboardingPage.completeOnboarding();
        // Enable ETH and LTC so their accounts are discovered before seeding trades.
        await settingsPage.changeNetworks({ enableNetworks: ['eth', 'ltc'] });
        await tradingStore.insertSwapHistory(SEEDED_TRADES);
    });

    test('View swap order history details', async ({ page, walletPage }) => {
        await test.step('Navigate to swap/exchange trading section', async () => {
            // openSwapTrading sets activeSection === 'exchange', which is required for
            // exchange trades to appear in TradingTransactionsList..
            await walletPage.openSwapTrading({ symbol: 'btc' });
        });

        await test.step('Open trading transactions history', async () => {
            const transactionsButton = page.getByTestId(
                '@trading/menu/wallet-trading-transactions',
            );
            await expect(transactionsButton).toBeVisible();
            await transactionsButton.click();

            await expect(page.getByTestId('@trading/transactions/heading')).toHaveText(
                'Trade history',
            );
        });

        await test.step('Verify trade appears in history list', async () => {
            const statusMap: Record<string, string> = {
                SUCCESS: 'Approved',
                ERROR: 'Rejected',
                CONFIRMING: 'Pending',
            };

            for (const trade of SEEDED_TRADES) {
                const tradeRow = page.getByTestId(
                    `@trading/transactions/list/swap-transaction/${trade.orderId}`,
                );

                await expect(tradeRow).toBeVisible();
                await expect(tradeRow.getByTestId('@trading/form/info/provider')).toContainText(
                    trade.data.exchange,
                    { ignoreCase: true },
                );
                await expect(tradeRow.getByTestId('@trading/transaction-id')).toContainText(
                    trade.orderId,
                );
                await expect(tradeRow.getByTestId('@trading/transactions/status')).toHaveText(
                    statusMap[trade.data.status],
                );
                const receiveSymbol =
                    (cryptoIdToSymbol(
                        trade.data.receive as Parameters<typeof cryptoIdToSymbol>[0],
                    ) ?? trade.data.receive).toUpperCase();

                await expect(
                    tradeRow.getByTestId('@trading/transactions/send/amount-with-symbol'),
                ).toHaveText(
                    `${localizeNumber(trade.data.sendStringAmount)} ${trade.sendSymbol.toUpperCase()}`,
                );
                await expect(
                    tradeRow.getByTestId('@trading/transactions/receive/amount-with-symbol'),
                ).toHaveText(
                    `${localizeNumber(trade.data.receiveStringAmount)} ${receiveSymbol}`,
                );

            }
        });

        await test.step('Click on trade to view details', async () => {
            // SUCCESS_TRADE is the most recent (2025-12-17), so it appears first in the list.
            const viewDetailsButton = page.getByRole('button', { name: 'View details' }).first();
            await expect(viewDetailsButton).toBeVisible();
            await viewDetailsButton.click();
        });

        await test.step('Verify order detail page is displayed', async () => {
            await expect(page.getByTestId('@trading/transaction/detail')).toBeVisible();
            await expect(page.getByTestId('@trading/transaction/detail/status')).toBeVisible();
        });
    });
});
