import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as steering_service from "../../../../backend/steering/encore.service";

export async function getDoc(params, opts) {
    const handler = (await import("../../../../backend/steering/get-doc")).getDoc;
    registerTestHandler({
        apiRoute: { service: "steering", name: "getDoc", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "getDoc", params, opts);
}

export async function listDocs(params, opts) {
    const handler = (await import("../../../../backend/steering/list-docs")).listDocs;
    registerTestHandler({
        apiRoute: { service: "steering", name: "listDocs", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "listDocs", params, opts);
}

export async function updateDoc(params, opts) {
    const handler = (await import("../../../../backend/steering/update-doc")).updateDoc;
    registerTestHandler({
        apiRoute: { service: "steering", name: "updateDoc", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "updateDoc", params, opts);
}

