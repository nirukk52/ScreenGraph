import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";
import { registerTestHandler } from "encore.dev/internal/codegen/appinit";

import * as steering_service from "../../../../steering/encore.service";

export async function archiveDoc(params, opts) {
    const handler = (await import("../../../../steering/archive-doc")).archiveDoc;
    registerTestHandler({
        apiRoute: { service: "steering", name: "archiveDoc", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "archiveDoc", params, opts);
}

export async function createDoc(params, opts) {
    const handler = (await import("../../../../steering/create-doc")).createDoc;
    registerTestHandler({
        apiRoute: { service: "steering", name: "createDoc", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "createDoc", params, opts);
}

export async function streamSteeringEvents(params, opts) {
    const handler = (await import("../../../../steering/events.stream")).streamSteeringEvents;
    registerTestHandler({
        apiRoute: { service: "steering", name: "streamSteeringEvents", raw: false, handler, streamingRequest: false, streamingResponse: true },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":true,"tags":[]},
    });

    return streamOut("steering", "streamSteeringEvents", params, opts);
}

export async function getDoc(params, opts) {
    const handler = (await import("../../../../steering/get-doc")).getDoc;
    registerTestHandler({
        apiRoute: { service: "steering", name: "getDoc", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "getDoc", params, opts);
}

export async function getDocRevision(params, opts) {
    const handler = (await import("../../../../steering/get-revision")).getDocRevision;
    registerTestHandler({
        apiRoute: { service: "steering", name: "getDocRevision", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "getDocRevision", params, opts);
}

export async function getDocsIndex(params, opts) {
    const handler = (await import("../../../../steering/index.read")).getDocsIndex;
    registerTestHandler({
        apiRoute: { service: "steering", name: "getDocsIndex", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "getDocsIndex", params, opts);
}

export async function rebuildDocsIndex(params, opts) {
    const handler = (await import("../../../../steering/index.rebuild")).rebuildDocsIndex;
    registerTestHandler({
        apiRoute: { service: "steering", name: "rebuildDocsIndex", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "rebuildDocsIndex", params, opts);
}

export async function listDocs(params, opts) {
    const handler = (await import("../../../../steering/list-docs")).listDocs;
    registerTestHandler({
        apiRoute: { service: "steering", name: "listDocs", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "listDocs", params, opts);
}

export async function listDocRevisions(params, opts) {
    const handler = (await import("../../../../steering/list-revisions")).listDocRevisions;
    registerTestHandler({
        apiRoute: { service: "steering", name: "listDocRevisions", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "listDocRevisions", params, opts);
}

export async function renameDoc(params, opts) {
    const handler = (await import("../../../../steering/rename-doc")).renameDoc;
    registerTestHandler({
        apiRoute: { service: "steering", name: "renameDoc", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "renameDoc", params, opts);
}

export async function restoreDoc(params, opts) {
    const handler = (await import("../../../../steering/restore-doc")).restoreDoc;
    registerTestHandler({
        apiRoute: { service: "steering", name: "restoreDoc", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "restoreDoc", params, opts);
}

export async function revertDocToRevision(params, opts) {
    const handler = (await import("../../../../steering/revert-revision")).revertDocToRevision;
    registerTestHandler({
        apiRoute: { service: "steering", name: "revertDocToRevision", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "revertDocToRevision", params, opts);
}

export async function searchDocs(params, opts) {
    const handler = (await import("../../../../steering/search.endpoint")).searchDocs;
    registerTestHandler({
        apiRoute: { service: "steering", name: "searchDocs", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "searchDocs", params, opts);
}

export async function getSteeringTools(params, opts) {
    const handler = (await import("../../../../steering/tools")).getSteeringTools;
    registerTestHandler({
        apiRoute: { service: "steering", name: "getSteeringTools", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "getSteeringTools", params, opts);
}

export async function updateDoc(params, opts) {
    const handler = (await import("../../../../steering/update-doc")).updateDoc;
    registerTestHandler({
        apiRoute: { service: "steering", name: "updateDoc", raw: false, handler, streamingRequest: false, streamingResponse: false },
        middlewares: steering_service.default.cfg.middlewares || [],
        endpointOptions: {"expose":true,"auth":false,"isRaw":false,"isStream":false,"tags":[]},
    });

    return apiCall("steering", "updateDoc", params, opts);
}

