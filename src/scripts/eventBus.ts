import mitt from '@/scripts/mitt'

export enum ITypesEnum {
    ERank,
    ERankInProgress,
    ERequirement,
    ETask,
    ETaskComment,
    EUser,
}

export type ApplicationEvents = {
    /** Emitted (debounced) after the Yjs document changed — locally, from sync or from an import. */
    'db-update': { type: ITypesEnum };
};

export const eventBus = mitt<ApplicationEvents>()
