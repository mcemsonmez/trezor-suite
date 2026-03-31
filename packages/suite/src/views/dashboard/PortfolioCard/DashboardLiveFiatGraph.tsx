import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';

import { Liveline } from 'liveline';
import { useTheme } from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { selectBaseCurrency, selectEnabledNetworks } from '@suite-common/wallet-core';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Box } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { useGraph, useSelector } from 'src/hooks/suite';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import { isNetworkWithGraphFeature } from 'src/utils/wallet/graph';

import {
    type BalanceEntry,
    type GraphDataPoint,
    appendCurrentBalance,
    balanceAtTime,
    buildBalanceSteps,
    createGraphFiatFormatter,
    formatGraphTime,
    getAllWindowSecs,
    getCoingeckoCoinId,
    getRangeBounds,
    getRangeKey,
} from './graphViewUtils';
import { getCoinbaseProductId, useCoinbaseLivePrices } from './useCoinbaseLivePrice';
import { useLiveFiatExchangeRate } from './useLiveFiatExchangeRate';
import { type PricePoint, usePriceHistories } from './usePriceHistory';

type CoinBalanceSource = {
    currentOnlyBalance: number;
    stepSets: BalanceEntry[][];
};
type CoinSeriesSource = {
    balanceSteps: BalanceEntry[];
    priceHistory: PricePoint[];
};

const priceAtTime = (points: PricePoint[], time: number): number => {
    if (points.length === 0) return 0;
    if (time <= points[0].time) return points[0].price;
    if (time >= points[points.length - 1].time) return points[points.length - 1].price;

    let lo = 0;
    let hi = points.length - 1;

    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (points[mid].time <= time) lo = mid;
        else hi = mid;
    }

    return points[lo].price;
};

const aggregateBalanceStepSets = (stepSets: BalanceEntry[][]): BalanceEntry[] => {
    const nonEmptyStepSets = stepSets.filter(stepSet => stepSet.length > 0);

    if (nonEmptyStepSets.length === 0) {
        return [];
    }

    const timeline = Array.from(
        new Set(nonEmptyStepSets.flatMap(stepSet => stepSet.map(step => step.time))),
    ).sort((a, b) => a - b);

    const aggregatedSteps: BalanceEntry[] = [];

    timeline.forEach(time => {
        const balance = nonEmptyStepSets.reduce(
            (sum, stepSet) => sum + balanceAtTime(stepSet, time),
            0,
        );
        const previousBalance = aggregatedSteps[aggregatedSteps.length - 1]?.balance;
        const nextBalance = balance.toString();

        if (previousBalance === nextBalance) {
            return;
        }

        aggregatedSteps.push({
            time,
            balance: nextBalance,
        });
    });

    return aggregatedSteps;
};

const buildPortfolioSeries = (sources: CoinSeriesSource[]): GraphDataPoint[] => {
    const nonEmptySources = sources.filter(
        source => source.balanceSteps.length > 0 && source.priceHistory.length > 0,
    );
    if (nonEmptySources.length === 0) {
        return [];
    }

    const earliestBalanceTime = Math.min(
        ...nonEmptySources.map(source => source.balanceSteps[0].time),
    );
    const timeline = Array.from(
        new Set(
            nonEmptySources.flatMap(source =>
                source.priceHistory
                    .map(point => point.time)
                    .filter(time => time >= earliestBalanceTime),
            ),
        ),
    ).sort((left, right) => left - right);

    if (timeline.length === 0 || timeline[0] !== earliestBalanceTime) {
        timeline.unshift(earliestBalanceTime);
    }

    return timeline.map(time => ({
        time,
        value: nonEmptySources.reduce(
            (sum, source) =>
                sum +
                balanceAtTime(source.balanceSteps, time) * priceAtTime(source.priceHistory, time),
            0,
        ),
    }));
};

type DashboardLiveFiatGraphProps = {
    accounts: Account[];
    isLive: boolean;
};

const selectGraphData = (state: AppState) => state.wallet.graph.data;
const buildCoinBalanceSources = ({
    accounts,
    graphData,
}: {
    accounts: Account[];
    graphData: readonly any[];
}) => {
    const sourcesByCoinId = new Map<string, CoinBalanceSource>();

    accounts.forEach(account => {
        const coinId = getCoingeckoCoinId(account.symbol);
        if (!coinId) {
            return;
        }

        const balanceSteps = appendCurrentBalance(
            buildBalanceSteps(graphData, account),
            account.formattedBalance,
        );

        const existingSource = sourcesByCoinId.get(coinId) ?? {
            currentOnlyBalance: 0,
            stepSets: [],
        };

        if (balanceSteps.length > 0) {
            existingSource.stepSets.push(balanceSteps);
        } else if (!new BigNumber(account.formattedBalance).isZero()) {
            existingSource.currentOnlyBalance += parseFloat(account.formattedBalance);
        }

        sourcesByCoinId.set(coinId, existingSource);
    });

    return sourcesByCoinId;
};

export const DashboardLiveFiatGraph = ({ accounts, isLive }: DashboardLiveFiatGraphProps) => {
    const theme = useTheme();
    const { selectedRange } = useGraph();
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const deferredSelectedRange = useDeferredValue(selectedRange);
    const [frozenNow, setFrozenNow] = useState(() => Date.now() / 1000);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const graphData = useSelector(selectGraphData);

    const eligibleAccounts = useMemo(
        () =>
            accounts.filter(
                account =>
                    account.visible &&
                    enabledNetworks.includes(account.symbol) &&
                    !!getCoingeckoCoinId(account.symbol) &&
                    isNetworkWithGraphFeature(account.symbol, account.backendType),
            ),
        [accounts, enabledNetworks],
    );
    const liveEligibleAccounts = useMemo(
        () => eligibleAccounts.filter(account => !!getCoinbaseProductId(account.symbol)),
        [eligibleAccounts],
    );

    const coinIds = useMemo(
        () =>
            eligibleAccounts
                .map(account => getCoingeckoCoinId(account.symbol))
                .filter((coinId): coinId is string => !!coinId),
        [eligibleAccounts],
    );
    const liveSymbols = useMemo(
        () => Array.from(new Set(liveEligibleAccounts.map(account => account.symbol))).sort(),
        [liveEligibleAccounts],
    );
    const rangeKey = getRangeKey(deferredSelectedRange);
    const accountKeysKey = useMemo(
        () => accounts.map(account => account.key).join('|'),
        [accounts],
    );
    const priceHistories = usePriceHistories(coinIds, deferredSelectedRange);
    const { priceHistoriesBySymbol: livePriceHistoriesBySymbol } = useCoinbaseLivePrices(
        liveSymbols,
        isLive,
    );
    const historicalFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const {
        exchangeRate: liveExchangeRate,
        isLoading: isLiveExchangeRateLoading,
        liveCurrencyCode,
    } = useLiveFiatExchangeRate(isLive);

    useEffect(() => {
        if (isLive) {
            return;
        }

        setFrozenNow(Date.now() / 1000);
    }, [accountKeysKey, isLive, rangeKey]);

    const coinBalanceSources = useMemo(
        () =>
            buildCoinBalanceSources({
                accounts: eligibleAccounts,
                graphData,
            }),
        [eligibleAccounts, graphData],
    );
    const liveCoinBalanceSources = useMemo(
        () =>
            buildCoinBalanceSources({
                accounts: liveEligibleAccounts,
                graphData,
            }),
        [graphData, liveEligibleAccounts],
    );

    const historicalRightEdge = useMemo(() => {
        const lastPriceTime = coinIds.reduce(
            (latest, coinId) => Math.max(latest, priceHistories[coinId]?.at(-1)?.time ?? 0),
            0,
        );

        return lastPriceTime > 0 ? lastPriceTime : frozenNow;
    }, [coinIds, frozenNow, priceHistories]);

    const historicalPoints = useMemo(() => {
        const rangeBounds = getRangeBounds(deferredSelectedRange, historicalRightEdge);
        const sources: CoinSeriesSource[] = Array.from(coinBalanceSources.entries()).map(
            ([coinId, coinBalanceSource]) => {
                const stepSets = [...coinBalanceSource.stepSets];
                const anchorTime = rangeBounds?.startTime ?? priceHistories[coinId]?.[0]?.time;

                if (coinBalanceSource.currentOnlyBalance > 0 && anchorTime !== undefined) {
                    stepSets.push([
                        {
                            time: anchorTime,
                            balance: coinBalanceSource.currentOnlyBalance.toString(),
                        },
                    ]);
                }

                return {
                    balanceSteps: aggregateBalanceStepSets(stepSets),
                    priceHistory: priceHistories[coinId] ?? [],
                };
            },
        );

        return buildPortfolioSeries(sources);
    }, [coinBalanceSources, deferredSelectedRange, historicalRightEdge, priceHistories]);

    const allWindowSecs = useMemo(
        () => getAllWindowSecs(historicalPoints, historicalRightEdge),
        [historicalPoints, historicalRightEdge],
    );

    const displayedHistoricalPoints = historicalPoints;
    const livePoints = useMemo(() => {
        if (!isLive) {
            return [];
        }
        if (liveExchangeRate === null) {
            return [];
        }

        const liveTimeline = Array.from(
            new Set(
                liveEligibleAccounts.flatMap(account =>
                    (livePriceHistoriesBySymbol[account.symbol] ?? [])
                        .map(point => point.time)
                        .filter(time => Number.isFinite(time)),
                ),
            ),
        ).sort((a, b) => a - b);
        const liveSources: CoinSeriesSource[] = Array.from(liveCoinBalanceSources.entries()).map(
            ([coinId, coinBalanceSource]) => ({
                balanceSteps: aggregateBalanceStepSets(coinBalanceSource.stepSets),
                priceHistory: liveEligibleAccounts.find(
                    account => getCoingeckoCoinId(account.symbol) === coinId,
                )
                    ? (livePriceHistoriesBySymbol[
                          liveEligibleAccounts.find(
                              account => getCoingeckoCoinId(account.symbol) === coinId,
                          )!.symbol
                      ] ?? [])
                    : [],
            }),
        );
        const appendedPoints = liveTimeline.map(time => ({
            time,
            value:
                liveSources.reduce(
                    (sum, source) =>
                        sum +
                        balanceAtTime(source.balanceSteps, time) *
                            priceAtTime(source.priceHistory, time),
                    0,
                ) * liveExchangeRate,
        }));

        return appendedPoints;
    }, [
        isLive,
        liveCoinBalanceSources,
        liveEligibleAccounts,
        liveExchangeRate,
        livePriceHistoriesBySymbol,
    ]);

    const activeWindow = isLive
        ? 60
        : (getRangeBounds(deferredSelectedRange, historicalRightEdge)?.window ?? allWindowSecs);
    const currentValue = (isLive ? livePoints : displayedHistoricalPoints).at(-1)?.value ?? 0;
    const isLoading = isLive
        ? isLiveExchangeRateLoading || (liveEligibleAccounts.length > 0 && livePoints.length < 2)
        : eligibleAccounts.length > 0 &&
          coinIds.some(coinId => (priceHistories[coinId]?.length ?? 0) === 0) &&
          displayedHistoricalPoints.length === 0;
    const fiatFormatter = useMemo(
        () =>
            createGraphFiatFormatter({
                currencyCode: isLive ? liveCurrencyCode : historicalFiatCurrencyCode,
                locale,
            }),
        [historicalFiatCurrencyCode, isLive, liveCurrencyCode, locale],
    );

    const formatTime = useCallback(
        (time: number) => formatGraphTime({ activeWindow, locale, time }),
        [activeWindow, locale],
    );

    const formatValue = useCallback(
        (value: number) => fiatFormatter.format(value),
        [fiatFormatter],
    );

    return (
        <Box flex="1" height="100%" position={{ type: 'relative' }} minWidth={0}>
            <Liveline
                data={isLive ? livePoints : displayedHistoricalPoints}
                value={currentValue}
                theme={theme.mode}
                color={theme.baseContentBrand}
                grid
                badge={isLive}
                pulse={isLive}
                momentum={isLive}
                exaggerate={isLive}
                fill
                scrub
                padding={{ top: 0, bottom: 30, left: 0, right: 60 }}
                loading={isLoading}
                formatTime={formatTime}
                formatValue={formatValue}
                window={activeWindow}
            />
        </Box>
    );
};
