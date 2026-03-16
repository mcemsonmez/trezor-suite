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

        await test.step('Verify trades are ordered by date descending', async () => {
            const sortedTrades = [...SEEDED_TRADES].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
            const rows = page
                .getByTestId('@trading/transactions/list')
                .locator('[data-testid^="@trading/transactions/list/swap-transaction/"]');

            for (const [index, trade] of sortedTrades.entries()) {
                await expect(rows.nth(index)).toHaveAttribute(
                    'data-testid',
                    `@trading/transactions/list/swap-transaction/${trade.orderId}`,
                );
            }
            await expect(rows).toHaveCount(SEEDED_TRADES.length);
        });

        await test.step('Verify trade appears in history list', async () => {
            const statusMap: Record<string, string> = {
                SUCCESS: 'Approved',
                ERROR: 'Rejected',
                CONFIRMING: 'Pending',
            };

            await expect(page.getByTestId('@trading/transactions/count')).toHaveText(
                `${SEEDED_TRADES.length} swaps`,
            );

            for (const trade of SEEDED_TRADES) {
                const tradeRow = page.getByTestId(
                    `@trading/transactions/list/swap-transaction/${trade.orderId}`,
                );

                await expect(tradeRow).toBeVisible();
                await expect
                    .soft(tradeRow.getByTestId('@trading/offers/quote/provider'))
                    .toContainText(trade.data.exchange, { ignoreCase: true });
                await expect
                    .soft(tradeRow.getByTestId('@trading/transaction-id'))
                    .toContainText(trade.orderId);
                await expect
                    .soft(tradeRow.getByTestId('@trading/transactions/status'))
                    .toHaveText(statusMap[trade.data.status]);
                const receiveSymbol = (
                    cryptoIdToSymbol(
                        trade.data.receive as Parameters<typeof cryptoIdToSymbol>[0],
                    ) ?? trade.data.receive
                ).toUpperCase();
                await expect
                    .soft(tradeRow.getByTestId('@trading/transactions/send/amount-with-symbol'))
                    .toHaveText(
                        `${localizeNumber(trade.data.sendStringAmount)} ${trade.sendSymbol.toUpperCase()}`,
                    );
                await expect
                    .soft(tradeRow.getByTestId('@trading/transactions/receive/amount-with-symbol'))
                    .toHaveText(
                        `${localizeNumber(trade.data.receiveStringAmount)} ${receiveSymbol}`,
                    );
                await expect.soft(tradeRow.getByTestId('@trading/transactions/date')).toBeVisible();
            }
        });

        const detailStatusMap: Record<string, string> = {
            SUCCESS: 'Swap successful',
            ERROR: 'Transaction failed',
            CONFIRMING: 'Sending transaction',
        };

        for (const trade of SEEDED_TRADES) {
            await test.step(`Open detail for trade ${trade.orderId}`, async () => {
                const tradeRow = page.getByTestId(
                    `@trading/transactions/list/swap-transaction/${trade.orderId}`,
                );
                await tradeRow.getByRole('button', { name: 'View details' }).click();
            });

            await test.step(`Verify detail page for trade ${trade.orderId}`, async () => {
                await expect(page.getByTestId('@trading/transaction/detail')).toBeVisible();
                await expect
                    .soft(page.getByTestId('@trading/transaction/detail/status'))
                    .toHaveText(detailStatusMap[trade.data.status]);

                // Verify sidebar send/receive amounts
                const sidebar = page.getByTestId('@trading/transaction/detail/sidebar');
                const receiveSymbol = (
                    cryptoIdToSymbol(
                        trade.data.receive as Parameters<typeof cryptoIdToSymbol>[0],
                    ) ?? trade.data.receive
                ).toUpperCase();
                const sidebarAmounts = sidebar.getByTestId(
                    '@trading/offers/quote/crypto-amount-with-symbol',
                );
                await expect
                    .soft(sidebarAmounts.nth(0))
                    .toHaveText(
                        `${localizeNumber(trade.data.sendStringAmount)} ${trade.sendSymbol.toUpperCase()}`,
                    );
                await expect
                    .soft(sidebarAmounts.nth(1))
                    .toHaveText(
                        `${localizeNumber(trade.data.receiveStringAmount)} ${receiveSymbol}`,
                    );

                const providerInStatusCard = page
                    .getByTestId('@trading/transaction/detail/status-card')
                    .getByTestId('@trading/form/info/provider');
                await expect.soft(providerInStatusCard).toBeVisible();
                await expect
                    .soft(providerInStatusCard)
                    .toContainText(trade.data.exchange, { ignoreCase: true });
            });

            await test.step(`Navigate back to transaction list`, async () => {
                await page.getByTestId('@trading/menu/wallet-trading-transactions').click();
                await expect(page.getByTestId('@trading/transactions/heading')).toBeVisible();
            });
        }
    });
});
