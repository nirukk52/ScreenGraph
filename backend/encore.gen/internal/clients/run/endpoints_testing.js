import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as run_service from "../../../../run/encore.service";

export async function cancel(params, opts) {
    const handler = (await import("../../../../run/cancel")).cancel;
    registerTestHandler({
        apiRoute: { service: "run", name: "cancel", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: run_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("run", "cancel", params, opts);
}

export async function start(params, opts) {
    const handler = (await import("../../../../run/start")).start;
    registerTestHandler({
        apiRoute: { service: "run", name: "start", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: run_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("run", "start", params, opts);
}

export async function stream(params, opts) {
    const handler = (await import("../../../../run/stream")).stream;
    registerTestHandler({
        apiRoute: { service: "run", name: "stream", raw: false, handler, streamingRequest: false, streamingResponse: true },
        middlewares: run_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":true,"tags":[]},
    });

    return streamOut("run", "stream", params, opts);
}

