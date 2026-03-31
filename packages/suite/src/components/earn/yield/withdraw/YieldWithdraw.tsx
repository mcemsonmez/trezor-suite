import { FormProvider } from 'react-hook-form';

import { type EarnParams } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

import { useAllowance } from 'src/hooks/wallet/allowance/useAllowance';
import { AllowanceContext } from 'src/hooks/wallet/allowance/useAllowanceContext';

import { YieldWithdrawForm } from './YieldWithdrawForm';
import { useYieldWithdraw } from './useYieldWithdraw';
import { YieldWithdrawContext } from './useYieldWithdrawContext';

type YieldWithdrawProps = {
    account: Account;
    routeParams: EarnParams;
};

export const YieldWithdraw = ({ account, routeParams }: YieldWithdrawProps) => {
    const allowanceContextValue = useAllowance({ account });
    const yieldWithdrawContextValues = useYieldWithdraw({ account, routeParams });

    if (!yieldWithdrawContextValues) {
        return null;
    }

    return (
        <AllowanceContext.Provider value={allowanceContextValue}>
            <YieldWithdrawContext.Provider value={yieldWithdrawContextValues}>
                <FormProvider {...yieldWithdrawContextValues.methods}>
                    <YieldWithdrawForm />
                </FormProvider>
            </YieldWithdrawContext.Provider>
        </AllowanceContext.Provider>
    );
};
