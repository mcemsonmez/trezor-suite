import { useEffect, useMemo, useState } from 'react';

import { fetchFiatExchangeRate } from '@suite-common/fiat-services';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { isFiatBaseCurrencyCode } from '@trezor/blockchain-link-types';

import { useSelector } from 'src/hooks/suite';

const liveFiatRateCache = new Map<string, number>();

export const useLiveFiatExchangeRate = (enabled: boolean) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const liveCurrencyCode =
        isFiatBaseCurrencyCode(baseCurrencyCode) && baseCurrencyCode !== 'usd'
            ? baseCurrencyCode
            : 'usd';
    const [exchangeRate, setExchangeRate] = useState<number | null>(
        liveCurrencyCode === 'usd' ? 1 : null,
    );

    useEffect(() => {
        let isActive = true;

        if (!enabled || liveCurrencyCode === 'usd') {
            setExchangeRate(1);

            return;
        }

        const cachedRate = liveFiatRateCache.get(liveCurrencyCode);
        if (cachedRate !== undefined) {
            setExchangeRate(cachedRate);

            return;
        }

        setExchangeRate(null);

        fetchFiatExchangeRate({
            baseCurrencyCode: 'usd',
            quoteCurrencyCode: liveCurrencyCode,
        }).then(rate => {
            if (!isActive || rate === null) {
                return;
            }

            liveFiatRateCache.set(liveCurrencyCode, rate);
            setExchangeRate(rate);
        });

        return () => {
            isActive = false;
        };
    }, [enabled, liveCurrencyCode]);

    return useMemo(
        () => ({
            exchangeRate,
            isLoading: enabled && liveCurrencyCode !== 'usd' && exchangeRate === null,
            liveCurrencyCode,
        }),
        [enabled, exchangeRate, liveCurrencyCode],
    );
};
