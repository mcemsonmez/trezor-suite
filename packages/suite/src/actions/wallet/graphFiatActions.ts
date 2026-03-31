import { createSelector } from '@reduxjs/toolkit';

import {
    fetchGraphHistoricFiatRates,
    getGraphFiatFetchTimestamp,
    isGraphHistoricResolutionCoverageStale,
    isGraphHistoricResolutionStale,
    mergeGraphHistoricFiatSeries,
} from '@suite-common/fiat-services';
import { createThunk } from '@suite-common/redux-utils';
import {
    type GraphFiatCoinEntry,
    type GraphFiatPoint,
    type GraphFiatResolution,
} from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { type AppState } from 'src/types/suite';

export const getGraphFiatEntryKey = ({
    baseCurrencyCode,
    coinId,
}: {
    baseCurrencyCode: BaseCurrencyCode;
    coinId: string;
}) => `${coinId}:${baseCurrencyCode}`;

const createEmptyGraphFiatCoinEntry = (baseCurrencyCode: BaseCurrencyCode): GraphFiatCoinEntry => ({
    currency: baseCurrencyCode,
    resolutions: {
        day: {
            points: [],
            fetchedAt: null,
            lastPointTimestamp: null,
            isLoading: false,
            error: null,
        },
        month: {
            points: [],
            fetchedAt: null,
            lastPointTimestamp: null,
            isLoading: false,
            error: null,
        },
        max: {
            points: [],
            fetchedAt: null,
            lastPointTimestamp: null,
            isLoading: false,
            error: null,
        },
    },
});

export const refreshGraphFiatResolution = createThunk(
    'wallet/graphFiat/refreshGraphFiatResolution',
    async ({
        baseCurrencyCode,
        coinId,
        resolution,
    }: {
        baseCurrencyCode: BaseCurrencyCode;
        coinId: string;
        resolution: GraphFiatResolution;
    }) => ({
        baseCurrencyCode,
        coinId,
        resolution,
        points: await fetchGraphHistoricFiatRates({ baseCurrencyCode, coinId, resolution }),
        fetchedAt: getGraphFiatFetchTimestamp(),
    }),
);

const selectGraphFiatState = (state: AppState) => state.wallet.graphFiat;

export const selectGraphFiatCoinEntry = (
    state: AppState,
    coinId: string,
    baseCurrencyCode: BaseCurrencyCode,
): GraphFiatCoinEntry =>
    selectGraphFiatState(state)[getGraphFiatEntryKey({ baseCurrencyCode, coinId })] ??
    createEmptyGraphFiatCoinEntry(baseCurrencyCode);

const getResolutionsToRefresh = (coinEntry: GraphFiatCoinEntry) => {
    const resolutions: Array<{
        reason: 'coverage' | 'missing' | 'stale';
        resolution: GraphFiatResolution;
    }> = [];
    const dayEntry = coinEntry.resolutions.day;
    const dayMissing = dayEntry.points.length === 0;
    const dayCoverageStale = isGraphHistoricResolutionCoverageStale(
        dayEntry.lastPointTimestamp,
        'day',
    );
    const dayStale = isGraphHistoricResolutionStale(dayEntry.fetchedAt, 'day');
    let dayReason: 'coverage' | 'missing' | 'stale' | undefined;

    if (dayMissing) {
        dayReason = 'missing';
    } else if (dayCoverageStale) {
        dayReason = 'coverage';
    } else if (dayStale) {
        dayReason = 'stale';
    }

    if (!dayEntry.isLoading && (dayMissing || dayCoverageStale || dayStale)) {
        resolutions.push({
            reason: dayReason ?? 'stale',
            resolution: 'day',
        });
    }

    const maxEntry = coinEntry.resolutions.max;

    if (!maxEntry.isLoading && maxEntry.points.length === 0) {
        resolutions.push({
            reason: 'missing',
            resolution: 'max',
        });
    }

    const monthEntry = coinEntry.resolutions.month;
    const monthMissing = monthEntry.points.length === 0;
    const monthStale = isGraphHistoricResolutionStale(monthEntry.fetchedAt, 'month');

    if (!monthEntry.isLoading && (monthMissing || monthStale)) {
        resolutions.push({
            reason: monthMissing ? 'missing' : 'stale',
            resolution: 'month',
        });
    }

    return resolutions;
};

export const ensureGraphFiatRates = createThunk(
    'wallet/graphFiat/ensureGraphFiatRates',
    async (
        { baseCurrencyCode, coinIds }: { baseCurrencyCode: BaseCurrencyCode; coinIds: string[] },
        { dispatch, getState }: { dispatch: any; getState: () => AppState },
    ) => {
        const uniqueCoinIds = Array.from(new Set(coinIds)).filter(Boolean).sort();
        await Promise.all(
            uniqueCoinIds.map(async coinId => {
                const attemptedResolutions = new Set<GraphFiatResolution>();

                while (true) {
                    const coinEntry = selectGraphFiatCoinEntry(
                        getState(),
                        coinId,
                        baseCurrencyCode,
                    );
                    const refreshes = getResolutionsToRefresh(coinEntry).filter(
                        ({ resolution }) => !attemptedResolutions.has(resolution),
                    );

                    if (refreshes.length === 0) {
                        break;
                    }

                    refreshes.forEach(({ reason, resolution }) => {
                        attemptedResolutions.add(resolution);
                        console.warn(
                            `[graphFiat] ${reason === 'missing' ? 'fetch' : 'refetch'} ${coinId} ${resolution}`,
                            {
                                baseCurrencyCode,
                                fetchedAt: coinEntry.resolutions[resolution].fetchedAt,
                                lastPointTimestamp:
                                    coinEntry.resolutions[resolution].lastPointTimestamp,
                                points: coinEntry.resolutions[resolution].points.length,
                                reason,
                            },
                        );
                    });

                    await Promise.all(
                        refreshes.map(({ resolution }) =>
                            dispatch(
                                refreshGraphFiatResolution({
                                    baseCurrencyCode,
                                    coinId,
                                    resolution,
                                }),
                            ),
                        ),
                    );
                }
            }),
        );
    },
);

export const selectMergedGraphFiatSeries = createSelector([selectGraphFiatCoinEntry], coinEntry =>
    mergeGraphHistoricFiatSeries({
        max: coinEntry.resolutions.max.points,
        month: coinEntry.resolutions.month.points,
        day: coinEntry.resolutions.day.points,
    }),
);

export const selectGraphFiatSeriesByCoinIds = createSelector(
    [
        selectGraphFiatState,
        (_state: AppState, coinIds: string[]) => Array.from(new Set(coinIds)).sort(),
        (_state: AppState, _coinIds: string[], baseCurrencyCode: BaseCurrencyCode) =>
            baseCurrencyCode,
    ],
    (graphFiatState, coinIds, baseCurrencyCode): Record<string, GraphFiatPoint[]> =>
        Object.fromEntries(
            coinIds.map(coinId => [
                coinId,
                mergeGraphHistoricFiatSeries({
                    max: graphFiatState[getGraphFiatEntryKey({ baseCurrencyCode, coinId })]
                        ?.resolutions.max.points,
                    month: graphFiatState[getGraphFiatEntryKey({ baseCurrencyCode, coinId })]
                        ?.resolutions.month.points,
                    day: graphFiatState[getGraphFiatEntryKey({ baseCurrencyCode, coinId })]
                        ?.resolutions.day.points,
                }),
            ]),
        ),
);
