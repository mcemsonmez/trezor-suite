import { AsyncThunkAction, ThunkAction } from '@reduxjs/toolkit';
import type { Action, AnyAction } from 'redux';

declare module 'redux' {
    export interface Dispatch<A extends Action = AnyAction> {
        <TAction extends A>(action: TAction): TAction;

        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;

        <ReturnType = any, State = any, ExtraThunkArg = any>(
            thunkAction: ThunkAction<ReturnType, State, ExtraThunkArg, A>,
        ): ReturnType;
    }
}
