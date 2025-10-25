import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as run_service from "../../../../backend/run/encore.service";

export async function cancel(params, opts) {
    const handler = (await import("../../../../backend/run/cancel")).cancel;
    registerTestHandler({
        apiRoute: { service: "run", name: "cancel", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: run_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("run", "cancel", params, opts);
}

export async function health(params, opts) {
    const handler = (await import("../../../../backend/run/health")).health;
    registerTestHandler({
        apiRoute: { service: "run", name: "health", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: run_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("run", "health", params, opts);
}

export async function start(params, opts) {
    const handler = (await import("../../../../backend/run/start")).start;
    registerTestHandler({
        apiRoute: { service: "run", name: "start", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: run_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("run", "start", params, opts);
}

export async function stream(params, opts) {
    const handler = (await import("../../../../backend/run/stream")).stream;
    registerTestHandler({
        apiRoute: { service: "run", name: "stream", raw: false, handler, streamingRequest: false, streamingResponse: true },
        middlewares: run_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":true,"tags":[]},
    });

    return streamOut("run", "stream", params, opts);
}

