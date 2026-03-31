import { createReducer } from '@reduxjs/toolkit';

import {
    type GraphFiatCoinEntry,
    type GraphFiatResolution,
    type GraphFiatResolutionEntry,
} from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { STORAGE } from 'src/actions/suite/constants';
import { type StorageLoadAction } from 'src/actions/suite/storageActions';

import {
    getGraphFiatEntryKey,
    refreshGraphFiatResolution,
} from '../../actions/wallet/graphFiatActions';

export type GraphFiatState = Record<string, GraphFiatCoinEntry>;

const createEmptyGraphFiatResolutionEntry = (): GraphFiatResolutionEntry => ({
    points: [],
    fetchedAt: null,
    lastPointTimestamp: null,
    isLoading: false,
    error: null,
});

export const createEmptyGraphFiatCoinEntry = (
    baseCurrencyCode: BaseCurrencyCode,
): GraphFiatCoinEntry => ({
    currency: baseCurrencyCode,
    resolutions: {
        day: createEmptyGraphFiatResolutionEntry(),
        month: createEmptyGraphFiatResolutionEntry(),
        max: createEmptyGraphFiatResolutionEntry(),
    },
});

const getCoinEntry = (
    state: GraphFiatState,
    coinId: string,
    baseCurrencyCode: BaseCurrencyCode,
) => {
    const entryKey = getGraphFiatEntryKey({ baseCurrencyCode, coinId });

    if (!state[entryKey]) {
        state[entryKey] = createEmptyGraphFiatCoinEntry(baseCurrencyCode);
    }

    return state[entryKey];
};

const getResolutionEntry = (
    state: GraphFiatState,
    baseCurrencyCode: BaseCurrencyCode,
    coinId: string,
    resolution: GraphFiatResolution,
) => getCoinEntry(state, coinId, baseCurrencyCode).resolutions[resolution];

const mergeResolutionPoints = (
    existingPoints: GraphFiatResolutionEntry['points'],
    nextPoints: GraphFiatResolutionEntry['points'],
) => {
    const pointsByTime = new Map<number, number>();

    existingPoints.forEach(point => {
        pointsByTime.set(point.time, point.price);
    });

    nextPoints.forEach(point => {
        pointsByTime.set(point.time, point.price);
    });

    return Array.from(pointsByTime.entries())
        .map(([time, price]) => ({ time, price }))
        .sort((left, right) => left.time - right.time);
};

const initialState: GraphFiatState = {};

export const graphFiatReducer = createReducer(initialState, builder => {
    builder
        .addCase(refreshGraphFiatResolution.pending, (state, action) => {
            const { baseCurrencyCode, coinId, resolution } = action.meta.arg;
            const resolutionEntry = getResolutionEntry(state, baseCurrencyCode, coinId, resolution);

            resolutionEntry.isLoading = true;
            resolutionEntry.error = null;
        })
        .addCase(refreshGraphFiatResolution.fulfilled, (state, action) => {
            const { baseCurrencyCode, coinId, resolution, points, fetchedAt } = action.payload;
            const resolutionEntry = getResolutionEntry(state, baseCurrencyCode, coinId, resolution);

            resolutionEntry.points =
                resolution === 'month'
                    ? mergeResolutionPoints(resolutionEntry.points, points)
                    : points;
            resolutionEntry.fetchedAt = fetchedAt;
            resolutionEntry.lastPointTimestamp = resolutionEntry.points.at(-1)?.time ?? null;
            resolutionEntry.isLoading = false;
            resolutionEntry.error = null;
        })
        .addCase(refreshGraphFiatResolution.rejected, (state, action) => {
            const { baseCurrencyCode, coinId, resolution } = action.meta.arg;
            const resolutionEntry = getResolutionEntry(state, baseCurrencyCode, coinId, resolution);

            resolutionEntry.isLoading = false;
            resolutionEntry.error = action.error.message ?? 'Failed to refresh graph fiat history.';
        })
        .addMatcher(
            (action): action is StorageLoadAction => action.type === STORAGE.LOAD,
            (state, action) => {
                action.payload.graphFiatRates?.forEach(({ key, value }) => {
                    state[key] = value;
                });
            },
        );
});
