import { useCallback, useState } from 'react';

import { useSubmitTxHash } from '@suite-common/earn-api';
import { toTokenCryptoId } from '@suite-common/trading';
import type { Account } from '@suite-common/wallet-types';

import type { YieldApproveModalState, YieldPendingTransactionState } from '../common/types';
import { getErrorMessage } from '../common/yieldFlowUtils';

type UseYieldApproveParams = {
    account: Account | undefined;
    contractAddress: string | undefined;
    setPendingTransaction: (tx: YieldPendingTransactionState | null) => void;
    setErrorMessage: (message: string | undefined) => void;
};

export type UseYieldApproveResult = {
    approveAmount: string;
    setApproveAmount: (amount: string) => void;
    approveModalState: YieldApproveModalState | null;
    isApprovePending: boolean;
    setIsApprovePending: (pending: boolean) => void;
    openApproveModal: (params: {
        amount: string;
        spender: string;
        transactionId?: string;
        providerId?: string;
        transactionKind: Extract<
            YieldPendingTransactionState['kind'],
            'approve' | 'revoke' | 'revoke-only'
        >;
    }) => boolean;
    resetApproveState: (amount: string) => void;
    handleApproveSuccessTxid: (txid: string) => Promise<void>;
    handleApproveCancel: () => void;
};

export const useYieldApprove = ({
    account,
    contractAddress,
    setPendingTransaction,
    setErrorMessage,
}: UseYieldApproveParams): UseYieldApproveResult => {
    const { mutateAsync: submitTxHash } = useSubmitTxHash({});
    const [approveAmount, setApproveAmount] = useState('0');
    const [approveModalState, setApproveModalState] = useState<YieldApproveModalState | null>(null);
    const [submitTxHashTransactionId, setSubmitTxHashTransactionId] = useState<string | null>(null);
    const [isApprovePending, setIsApprovePending] = useState(false);

    const openApproveModal = useCallback(
        ({
            amount,
            spender,
            transactionId,
            providerId,
            transactionKind,
        }: {
            amount: string;
            spender: string;
            transactionId?: string;
            providerId?: string;
            transactionKind: Extract<
                YieldPendingTransactionState['kind'],
                'approve' | 'revoke' | 'revoke-only'
            >;
        }): boolean => {
            if (!account) {
                setErrorMessage('Yield account is missing.');

                return false;
            }

            if (!contractAddress) {
                setErrorMessage('Yield approval token contract address is missing.');

                return false;
            }

            setSubmitTxHashTransactionId(transactionId ?? null);
            setApproveModalState({
                amount,
                cryptoId: toTokenCryptoId(account.symbol, contractAddress),
                spender,
                providerId,
                transactionKind,
            });

            return true;
        },
        [account, contractAddress, setErrorMessage],
    );

    const resetApproveState = useCallback(
        (amount: string) => {
            setApproveAmount(amount);
            setApproveModalState(null);
            setPendingTransaction(null);
            setSubmitTxHashTransactionId(null);
            setErrorMessage(undefined);
        },
        [setPendingTransaction, setErrorMessage],
    );

    const handleApproveSuccessTxid = useCallback(
        async (txid: string) => {
            try {
                if (submitTxHashTransactionId) {
                    await submitTxHash({
                        txId: submitTxHashTransactionId,
                        txHash: txid,
                    });
                }

                setApproveModalState(null);
                setSubmitTxHashTransactionId(null);
                setPendingTransaction({
                    kind: approveModalState?.transactionKind ?? 'approve',
                    txid,
                    amount: approveAmount,
                });
            } catch (error) {
                setErrorMessage(getErrorMessage(error));
            }
        },
        [
            approveAmount,
            approveModalState,
            setPendingTransaction,
            setErrorMessage,
            submitTxHashTransactionId,
            submitTxHash,
        ],
    );

    const handleApproveCancel = useCallback(() => {
        setApproveModalState(null);
        setSubmitTxHashTransactionId(null);
        setErrorMessage(undefined);
    }, [setErrorMessage]);

    return {
        approveAmount,
        setApproveAmount,
        approveModalState,
        isApprovePending,
        setIsApprovePending,
        openApproveModal,
        resetApproveState,
        handleApproveSuccessTxid,
        handleApproveCancel,
    };
};
