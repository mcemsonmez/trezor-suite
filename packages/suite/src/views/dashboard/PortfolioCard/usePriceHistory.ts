import { useEffect, useMemo } from 'react';

import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type GraphFiatPoint } from '@suite-common/wallet-types';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    ensureGraphFiatRates,
    selectGraphFiatSeriesByCoinIds,
} from 'src/actions/wallet/graphFiatActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type GraphRange } from 'src/types/wallet/graph';

export type PricePoint = GraphFiatPoint;

export const usePriceHistory = (
    coingeckoId: string | undefined,
    selectedRange: GraphRange,
): PricePoint[] => {
    const dispatch = useDispatch();
    const refreshKey = selectedRange.label;
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const graphFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const pointsByCoinId = useSelector(state =>
        selectGraphFiatSeriesByCoinIds(
            state,
            coingeckoId ? [coingeckoId] : [],
            graphFiatCurrencyCode,
        ),
    );

    useEffect(() => {
        if (!coingeckoId) return;

        dispatch(
            ensureGraphFiatRates({
                baseCurrencyCode: graphFiatCurrencyCode,
                coinIds: [coingeckoId],
            }),
        );
    }, [coingeckoId, dispatch, graphFiatCurrencyCode, refreshKey]);

    return coingeckoId ? (pointsByCoinId[coingeckoId] ?? []) : [];
};

export const usePriceHistories = (
    coingeckoIds: string[],
    selectedRange: GraphRange,
): Record<string, PricePoint[]> => {
    const dispatch = useDispatch();
    const refreshKey = selectedRange.label;
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const graphFiatCurrencyCode = isFiatBaseCurrencyCode(baseCurrencyCode)
        ? baseCurrencyCode
        : 'usd';
    const normalizedCoinIdsKey = useMemo(
        () => Array.from(new Set(coingeckoIds)).sort().join('|'),
        [coingeckoIds],
    );
    const normalizedCoinIds = useMemo(
        () => (normalizedCoinIdsKey ? (normalizedCoinIdsKey.split('|') as string[]) : []),
        [normalizedCoinIdsKey],
    );
    const pointsByCoinId = useSelector(state =>
        selectGraphFiatSeriesByCoinIds(state, normalizedCoinIds, graphFiatCurrencyCode),
    );

    useEffect(() => {
        if (normalizedCoinIds.length === 0) {
            return;
        }

        dispatch(
            ensureGraphFiatRates({
                baseCurrencyCode: graphFiatCurrencyCode,
                coinIds: normalizedCoinIds,
            }),
        );
    }, [dispatch, graphFiatCurrencyCode, normalizedCoinIds, normalizedCoinIdsKey, refreshKey]);

    return pointsByCoinId;
};
