import { type ReactNode, useEffect, useRef } from 'react';

import { selectAllAccountsToList } from '@suite-common/wallet-core';
import { SkeletonRectangle } from '@trezor/components';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useDispatch, useGraph, useSelector } from 'src/hooks/suite';
import { type Discovery } from 'src/types/wallet';

import { ContentFlex, useIsContentBelowBreakpoint } from '../../../support/suite/ContentFlex';

export type PortfolioCardHeaderProps = {
    discovery?: Discovery;
    fiatAmount: string;
    localCurrency: string;
    isDiscoveryRunning?: boolean;
    rightContent?: ReactNode;
};

export const PortfolioCardHeader = ({
    discovery,
    fiatAmount,
    localCurrency,
    isDiscoveryRunning,
    rightContent,
}: PortfolioCardHeaderProps) => {
    const accounts = useSelector(selectAllAccountsToList);
    const dispatch = useDispatch();
    const { selectedRange } = useGraph();
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();
    const previousSelectedRangeKeyRef = useRef<string | null>(null);

    useEffect(() => {
        const selectedRangeKey = `${selectedRange.label}:${selectedRange.startDate?.getTime() ?? 'null'}:${selectedRange.endDate?.getTime() ?? 'null'}`;

        if (previousSelectedRangeKeyRef.current === null) {
            previousSelectedRangeKeyRef.current = selectedRangeKey;

            return;
        }

        if (previousSelectedRangeKeyRef.current === selectedRangeKey) {
            return;
        }

        previousSelectedRangeKeyRef.current = selectedRangeKey;
        dispatch(
            updateGraphData({
                accounts,
                selectedRange,
            }),
        );
    }, [accounts, dispatch, selectedRange]);

    const valueLoading = isDiscoveryRunning || (!discovery && isNaN(Number(fiatAmount)));

    return (
        <ContentFlex
            justifyContent="space-between"
            alignItems={isContentBelowBreakpoint ? 'flex-start' : 'center'}
            gap={8}
            margin={{ top: 16, horizontal: 24, bottom: 16 }}
        >
            {valueLoading ? (
                <SkeletonRectangle width={140} height={53} />
            ) : (
                <FiatHeader
                    data-testid="@dashboard/portfolio/fiat-amount"
                    size="large"
                    amount={fiatAmount}
                    localCurrency={localCurrency}
                />
            )}
            {rightContent}
        </ContentFlex>
    );
};
