// Stand-in for the `cloudflare:workers` runtime module in Node-based unit tests.
export class DurableObject<Env = unknown> {
    constructor(
        protected ctx: DurableObjectState,
        protected env: Env,
    ) {}
}

type DurableObjectState = {
    acceptWebSocket(ws: unknown): void;
    getWebSockets(): unknown[];
    setWebSocketAutoResponse(pair?: unknown): void;
}
