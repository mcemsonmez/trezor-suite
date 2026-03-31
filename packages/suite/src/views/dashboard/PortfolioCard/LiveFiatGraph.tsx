import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type HoverPoint, Liveline } from 'liveline';
import { useTheme } from 'styled-components';

import { selectLanguage } from '@suite/settings';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';
import { Box } from '@trezor/components';

import { useGraph, useSelector } from 'src/hooks/suite';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';

import {
    type BalanceEntry,
    type GraphDataPoint,
    balanceAtTime,
    buildBalanceSteps,
    createGraphFiatFormatter,
    formatGraphTime,
    getAllWindowSecs,
    getCoingeckoCoinId,
    getRangeBounds,
    getRangeKey,
} from './graphViewUtils';
import { getCoinbaseProductId, useCoinbaseLivePrice } from './useCoinbaseLivePrice';
import { useLiveFiatExchangeRate } from './useLiveFiatExchangeRate';
import { type PricePoint, usePriceHistory } from './usePriceHistory';

const selectGraphData = (state: AppState) => state.wallet.graph.data;

const buildHistoricalPortfolio = (
    balanceSteps: BalanceEntry[],
    priceHistory: PricePoint[],
): GraphDataPoint[] => {
    if (balanceSteps.length === 0 || priceHistory.length === 0) {
        return [];
    }

    const startTime = balanceSteps[0].time;
    const zeroAnchorTime = startTime - 30 * 24 * 3600;
    const points: GraphDataPoint[] = [
        { time: zeroAnchorTime, value: 0 },
        { time: startTime - 1, value: 0 },
    ];

    for (const pp of priceHistory) {
        if (pp.time < startTime) continue;

        points.push({
            time: pp.time,
            value: balanceAtTime(balanceSteps, pp.time) * pp.price,
        });
    }

    return points;
};

type LiveFiatGraphProps = {
    account: Account;
    isLive: boolean;
    isGraphLoading?: boolean;
};

export const hasCoinbaseLiveSupport = (symbol: NetworkSymbol): boolean =>
    !!getCoinbaseProductId(symbol);

export const LiveFiatGraph = ({ account, isLive, isGraphLoading = false }: LiveFiatGraphProps) => {
    const theme = useTheme();
    const locale = useSelector(selectLanguage);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const { priceHistory: livePriceTicks, latestPrice } = useCoinbaseLivePrice(
        account.symbol,
        isLive,
    );

    const { selectedRange } = useGraph();
    const coingeckoId = getCoingeckoCoinId(account.symbol);
    const priceHistory = usePriceHistory(coingeckoId, selectedRange);
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const historicalFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const {
        exchangeRate: liveExchangeRate,
        isLoading: isLiveExchangeRateLoading,
        liveCurrencyCode,
    } = useLiveFiatExchangeRate(isLive);

    const [frozenNow, setFrozenNow] = useState(() => Date.now() / 1000);
    const [hoverPoint, setHoverPoint] = useState<HoverPoint | null>(null);

    const balance = parseFloat(account.formattedBalance);

    const prevAccountKeyRef = useRef(account.key);
    useEffect(() => {
        if (prevAccountKeyRef.current === account.key) {
            return;
        }

        prevAccountKeyRef.current = account.key;
        setHoverPoint(null);
    }, [account.key]);

    const rangeKey = getRangeKey(selectedRange);
    useEffect(() => {
        if (isLive) {
            return;
        }

        setFrozenNow(Date.now() / 1000);
    }, [account.key, isLive, rangeKey]);

    // Primary path: Blockbook/worker balance history.
    const graphData = useSelector(selectGraphData);
    const blockbookSteps = useMemo(
        () => buildBalanceSteps(graphData, account),
        [graphData, account],
    );
    const rawBalanceSteps = blockbookSteps;

    // Append current real balance so balanceAtTime returns the correct value
    // for recent timestamps (graph data may lag behind latest txs).
    const balanceSteps = useMemo(() => {
        if (rawBalanceSteps.length === 0) return rawBalanceSteps;

        const lastStep = rawBalanceSteps[rawBalanceSteps.length - 1];
        if (lastStep.balance === account.formattedBalance) return rawBalanceSteps;

        return [...rawBalanceSteps, { time: lastStep.time + 1, balance: account.formattedBalance }];
    }, [rawBalanceSteps, account.formattedBalance]);

    const historicalPoints = useMemo(
        () => buildHistoricalPortfolio(balanceSteps, priceHistory),
        [balanceSteps, priceHistory],
    );
    const historicalRightEdge = priceHistory.at(-1)?.time ?? frozenNow;
    const rangeBounds = getRangeBounds(selectedRange, historicalRightEdge);

    const allWindowSecs = useMemo(
        () => getAllWindowSecs(historicalPoints, historicalRightEdge),
        [historicalPoints, historicalRightEdge],
    );

    const displayedHistoricalPoints = historicalPoints;

    const livePoints: GraphDataPoint[] = useMemo(() => {
        if (!isLive) return [];
        if (liveExchangeRate === null) return [];

        return livePriceTicks.map(tick => ({
            time: tick.time,
            value: balance * tick.price * liveExchangeRate,
        }));
    }, [isLive, balance, liveExchangeRate, livePriceTicks]);

    // Mode-dependent values
    const data = isLive ? livePoints : displayedHistoricalPoints;
    const historicalWindow = rangeBounds?.window ?? allWindowSecs;
    const activeWindow = isLive ? 60 : historicalWindow;
    let currentValue = displayedHistoricalPoints.at(-1)?.value ?? 0;
    if (isLive) {
        currentValue =
            livePoints.at(-1)?.value ??
            (latestPrice !== null && liveExchangeRate !== null
                ? latestPrice * balance * liveExchangeRate
                : currentValue);
    }

    const isLoading = isLive
        ? isLiveExchangeRateLoading || livePoints.length < 2
        : priceHistory.length === 0 || (isGraphLoading && historicalPoints.length === 0);

    // Balance lookup for hover
    const allBalanceSteps = useMemo(
        () => [
            { time: 0, balance: '0' },
            ...balanceSteps,
            { time: historicalRightEdge, balance: account.formattedBalance },
        ],
        [account.formattedBalance, balanceSteps, historicalRightEdge],
    );

    const hoveredBalance = hoverPoint ? balanceAtTime(allBalanceSteps, hoverPoint.time) : null;
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

    const handleHover = useCallback((point: HoverPoint | null) => {
        setHoverPoint(point);
    }, []);

    const formatValue = useCallback(
        (v: number) => {
            const fiat = fiatFormatter.format(v);
            if (!isLive && hoveredBalance !== null) {
                return `${fiat}  ·  ${hoveredBalance.toFixed(8)} ${displaySymbol}`;
            }

            return fiat;
        },
        [displaySymbol, fiatFormatter, hoveredBalance, isLive],
    );

    return (
        <Box flex="1" height="100%" position={{ type: 'relative' }} minWidth={0}>
            <Liveline
                key={account.key}
                data={data}
                value={currentValue}
                theme={theme.mode}
                color={theme.baseContentBrand}
                grid
                badge={isLive}
                momentum={isLive}
                fill
                pulse={isLive}
                exaggerate={isLive}
                scrub
                padding={{ top: 0, bottom: 30, left: 0, right: 60 }}
                loading={isLoading}
                formatTime={formatTime}
                formatValue={formatValue}
                window={activeWindow}
                onHover={handleHover}
            />
        </Box>
    );
};
