import { type NetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';

import { type Account } from 'src/types/wallet';
import { type GraphRange } from 'src/types/wallet/graph';
import { accountGraphDataFilterFn, aggregateBalanceHistory } from 'src/utils/wallet/graph';

export type GraphDataPoint = {
    time: number;
    value: number;
};

export type BalanceEntry = {
    balance: string;
    time: number;
};

export type RangeBounds = {
    endTime: number;
    startTime: number;
    window: number;
};

const PRESET_RANGE_WINDOWS = {
    day: 24 * 3600,
    hour: 3600,
    month: 30 * 24 * 3600,
    week: 7 * 24 * 3600,
    year: 365 * 24 * 3600,
} as const;

const ALL_RANGE_WINDOW_BUFFER_SECS = 24 * 3600;

const COINGECKO_COIN_ID_OVERRIDES: Partial<Record<NetworkSymbol, string>> = {
    pol: 'polygon-ecosystem-token',
    bsc: 'binancecoin',
    arb: 'ethereum',
    base: 'ethereum',
    op: 'ethereum',
    avax: 'avalanche-2',
};

export const getCoingeckoCoinId = (symbol: NetworkSymbol): string | undefined =>
    COINGECKO_COIN_ID_OVERRIDES[symbol] ?? getCoingeckoId(symbol);

export const buildBalanceSteps = (graphData: readonly any[], account: Account): BalanceEntry[] => {
    const accountData = graphData.filter(d => accountGraphDataFilterFn(d, account));
    if (!accountData[0]?.data?.length) return [];

    const aggregated = aggregateBalanceHistory(accountData, 'day', 'account');

    return aggregated.map(d => ({
        time: d.time,
        balance: d.balance,
    }));
};

export const appendCurrentBalance = (steps: BalanceEntry[], currentBalance: string) => {
    if (steps.length === 0) {
        return steps;
    }

    const lastStep = steps[steps.length - 1];
    if (lastStep.balance === currentBalance) {
        return steps;
    }

    return [...steps, { time: lastStep.time + 1, balance: currentBalance }];
};

export const balanceAtTime = (steps: BalanceEntry[], time: number): number => {
    if (steps.length === 0) return 0;
    if (time <= steps[0].time) return parseFloat(steps[0].balance);
    if (time >= steps[steps.length - 1].time) return parseFloat(steps[steps.length - 1].balance);

    let lo = 0;
    let hi = steps.length - 1;

    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (steps[mid].time <= time) lo = mid;
        else hi = mid;
    }

    return parseFloat(steps[lo].balance);
};

export const getRangeKey = (selectedRange: GraphRange) =>
    `${selectedRange.label}:${selectedRange.startDate?.getTime() ?? 'null'}:${selectedRange.endDate?.getTime() ?? 'null'}`;

export const getRangeBounds = (selectedRange: GraphRange, now: number): RangeBounds | undefined => {
    if (selectedRange.label === 'all') {
        return;
    }

    const window = PRESET_RANGE_WINDOWS[selectedRange.label];
    const endTime = now;

    return {
        endTime,
        startTime: endTime - window,
        window,
    };
};

export const getAllWindowSecs = (
    historicalPoints: GraphDataPoint[],
    historicalRightEdge: number,
) => {
    if (historicalPoints.length === 0) {
        return 31536000;
    }

    const oldest = historicalPoints[0].time;
    const span = Math.ceil(historicalRightEdge - oldest) + ALL_RANGE_WINDOW_BUFFER_SECS;

    return span > 0 ? span : 31536000;
};

export const formatGraphTime = ({
    activeWindow,
    locale,
    time,
}: {
    activeWindow: number;
    locale: string;
    time: number;
}) => {
    const date = new Date(time * 1000);

    if (activeWindow <= 3600) {
        return date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }

    if (activeWindow <= 86400) {
        return date.toLocaleTimeString(locale, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }

    if (activeWindow < 259200) {
        return date.toLocaleDateString(locale, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
    }

    const showYear = activeWindow > 15_552_000;

    return date.toLocaleDateString(locale, {
        year: showYear ? 'numeric' : undefined,
        month: 'short',
        day: 'numeric',
    });
};

export const createGraphFiatFormatter = ({
    currencyCode,
    locale,
}: {
    currencyCode: string;
    locale: string;
}) =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode.toUpperCase(),
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
