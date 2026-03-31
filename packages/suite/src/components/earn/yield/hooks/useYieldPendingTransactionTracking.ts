import { useEffect } from 'react';

import { selectTransactionByAccountKeyAndTxid } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { isPending } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import type { YieldPendingTransactionState } from '../common/types';

type UseYieldPendingTransactionTrackingProps = {
    account: Account;
    actionKind: Extract<YieldPendingTransactionState['kind'], 'supply' | 'withdraw'>;
    onActionSuccess: (amount: string) => void;
    onApproveSuccess: (amount: string) => void;
    onRevokeSuccess: () => void;
    pendingTransaction: YieldPendingTransactionState | null;
    setErrorMessage: (message: string | undefined) => void;
    setIsApprovePending: (pending: boolean) => void;
    setPendingTransaction: (tx: YieldPendingTransactionState | null) => void;
};

export const useYieldPendingTransactionTracking = ({
    account,
    actionKind,
    onActionSuccess,
    onApproveSuccess,
    onRevokeSuccess,
    pendingTransaction,
    setErrorMessage,
    setIsApprovePending,
    setPendingTransaction,
}: UseYieldPendingTransactionTrackingProps) => {
    const trackedPendingTransaction = useSelector(state =>
        pendingTransaction
            ? selectTransactionByAccountKeyAndTxid(state, account.key, pendingTransaction.txid)
            : null,
    );

    useEffect(() => {
        if (!pendingTransaction || !trackedPendingTransaction) {
            return;
        }

        if (isPending(trackedPendingTransaction)) {
            return;
        }

        if (trackedPendingTransaction.type === 'failed') {
            setPendingTransaction(null);
            setIsApprovePending(false);
            setErrorMessage('Transaction failed.');

            return;
        }

        if (pendingTransaction.kind === 'revoke' || pendingTransaction.kind === 'revoke-only') {
            setPendingTransaction(null);
            setIsApprovePending(false);
            onRevokeSuccess();

            return;
        }

        if (pendingTransaction.kind === 'approve') {
            setPendingTransaction(null);
            setIsApprovePending(false);
            onApproveSuccess(pendingTransaction.amount);

            return;
        }

        if (pendingTransaction.kind === actionKind) {
            setPendingTransaction(null);
            onActionSuccess(pendingTransaction.amount);

            return;
        }

        setPendingTransaction(null);
    }, [
        actionKind,
        onActionSuccess,
        onApproveSuccess,
        onRevokeSuccess,
        pendingTransaction,
        setErrorMessage,
        setIsApprovePending,
        setPendingTransaction,
        trackedPendingTransaction,
    ]);
};
