import { apiCall, streamIn, streamOut, streamInOut } from "encore.dev/internal/codegen/api";

const TEST_ENDPOINTS = typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test"
    ? await import("./endpoints_testing.js")
    : null;

export async function archiveDoc(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.archiveDoc(params, opts);
    }

    return apiCall("steering", "archiveDoc", params, opts);
}
export async function createDoc(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.createDoc(params, opts);
    }

    return apiCall("steering", "createDoc", params, opts);
}
export async function streamSteeringEvents(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.streamSteeringEvents(params, opts);
    }

    return streamOut("steering", "streamSteeringEvents", params, opts);
}
export async function getDoc(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getDoc(params, opts);
    }

    return apiCall("steering", "getDoc", params, opts);
}
export async function getDocRevision(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getDocRevision(params, opts);
    }

    return apiCall("steering", "getDocRevision", params, opts);
}
export async function getDocsIndex(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getDocsIndex(params, opts);
    }

    return apiCall("steering", "getDocsIndex", params, opts);
}
export async function rebuildDocsIndex(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.rebuildDocsIndex(params, opts);
    }

    return apiCall("steering", "rebuildDocsIndex", params, opts);
}
export async function listDocs(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.listDocs(params, opts);
    }

    return apiCall("steering", "listDocs", params, opts);
}
export async function listDocRevisions(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.listDocRevisions(params, opts);
    }

    return apiCall("steering", "listDocRevisions", params, opts);
}
export async function renameDoc(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.renameDoc(params, opts);
    }

    return apiCall("steering", "renameDoc", params, opts);
}
export async function restoreDoc(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.restoreDoc(params, opts);
    }

    return apiCall("steering", "restoreDoc", params, opts);
}
export async function revertDocToRevision(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.revertDocToRevision(params, opts);
    }

    return apiCall("steering", "revertDocToRevision", params, opts);
}
export async function searchDocs(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.searchDocs(params, opts);
    }

    return apiCall("steering", "searchDocs", params, opts);
}
export async function getSteeringTools(opts) {
    const params = undefined;
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.getSteeringTools(params, opts);
    }

    return apiCall("steering", "getSteeringTools", params, opts);
}
export async function updateDoc(params, opts) {
    if (typeof ENCORE_DROP_TESTS === "undefined" && process.env.NODE_ENV === "test") {
        return TEST_ENDPOINTS.updateDoc(params, opts);
    }

    return apiCall("steering", "updateDoc", params, opts);
}
