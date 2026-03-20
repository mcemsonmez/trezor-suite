import { type ThunkDispatch } from 'redux-thunk';

import { metadataThunks } from '@suite/metadata';
import { type DisableLegacyMetadataIfNeeded } from '@suite/suite-sync';

import { type Action, type AppState } from 'src/types/suite';

type CreateDisableLegacyMetadataIfNeeded = {
    getState: () => AppState;
    dispatch: ThunkDispatch<AppState, any, Action>;
};

/**
 * @deprecated Legacy Labeling compatibility code.
 */
export const createDisableLegacyMetadataIfNeeded =
    (deps: CreateDisableLegacyMetadataIfNeeded): DisableLegacyMetadataIfNeeded =>
    () => {
        const legacyMetadataState = deps.getState().metadata;

        if (legacyMetadataState.enabled) {
            deps.dispatch(metadataThunks.disableMetadata());
        }
    };
