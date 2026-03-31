import { FormProvider } from 'react-hook-form';

import { type EarnParams } from '@suite/router';
import { type Account } from '@suite-common/wallet-types';

import { useAllowance } from 'src/hooks/wallet/allowance/useAllowance';
import { AllowanceContext } from 'src/hooks/wallet/allowance/useAllowanceContext';

import { YieldSupplyForm } from './YieldSupplyForm';
import { useYieldSupply } from './useYieldSupply';
import { YieldSupplyContext } from './useYieldSupplyContext';

type YieldSupplyProps = {
    account: Account;
    routeParams: EarnParams;
};

export const YieldSupply = ({ account, routeParams }: YieldSupplyProps) => {
    const allowanceContextValue = useAllowance({ account });
    const yieldSupplyContextValues = useYieldSupply({ account, routeParams });

    if (!yieldSupplyContextValues) {
        return null;
    }

    return (
        <AllowanceContext.Provider value={allowanceContextValue}>
            <YieldSupplyContext.Provider value={yieldSupplyContextValues}>
                <FormProvider {...yieldSupplyContextValues.methods}>
                    <YieldSupplyForm />
                </FormProvider>
            </YieldSupplyContext.Provider>
        </AllowanceContext.Provider>
    );
};
