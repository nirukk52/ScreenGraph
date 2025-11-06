import { CallOpts } from "encore.dev/api";

import {
  StreamInOutHandlerFn,
  StreamInHandlerFn,
  StreamOutHandlerFn,
  StreamOutWithResponse,
  StreamIn,
  StreamInOut,
} from "encore.dev/api";

import { streamSteeringEvents as streamSteeringEvents_handler } from "../../../../steering/events.stream.js";

type StreamHandshake<Type extends (...args: any[]) => any> = Parameters<Type> extends [infer H, any] ? H : void;

type StreamRequest<Type> = Type extends
  | StreamInOutHandlerFn<any, infer Req, any>
  | StreamInHandlerFn<any, infer Req, any>
  | StreamOutHandlerFn<any, any>
  ? Req
  : never;

type StreamResponse<Type> = Type extends
  | StreamInOutHandlerFn<any, any, infer Resp>
  | StreamInHandlerFn<any, any, infer Resp>
  | StreamOutHandlerFn<any, infer Resp>
  ? Resp
  : never;

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { archiveDoc as archiveDoc_handler } from "../../../../steering/archive-doc.js";
declare const archiveDoc: WithCallOpts<typeof archiveDoc_handler>;
export { archiveDoc };

import { createDoc as createDoc_handler } from "../../../../steering/create-doc.js";
declare const createDoc: WithCallOpts<typeof createDoc_handler>;
export { createDoc };

export function streamSteeringEvents(
  ...args: StreamHandshake<typeof streamSteeringEvents_handler> extends void
    ? [opts?: CallOpts]
    : [data: StreamHandshake<typeof streamSteeringEvents_handler>, opts?: CallOpts]
): Promise<
  StreamIn<
    StreamResponse<typeof streamSteeringEvents_handler>
  >
>;
import { getDoc as getDoc_handler } from "../../../../steering/get-doc.js";
declare const getDoc: WithCallOpts<typeof getDoc_handler>;
export { getDoc };

import { getDocRevision as getDocRevision_handler } from "../../../../steering/get-revision.js";
declare const getDocRevision: WithCallOpts<typeof getDocRevision_handler>;
export { getDocRevision };

import { getDocsIndex as getDocsIndex_handler } from "../../../../steering/index.read.js";
declare const getDocsIndex: WithCallOpts<typeof getDocsIndex_handler>;
export { getDocsIndex };

import { rebuildDocsIndex as rebuildDocsIndex_handler } from "../../../../steering/index.rebuild.js";
declare const rebuildDocsIndex: WithCallOpts<typeof rebuildDocsIndex_handler>;
export { rebuildDocsIndex };

import { listDocs as listDocs_handler } from "../../../../steering/list-docs.js";
declare const listDocs: WithCallOpts<typeof listDocs_handler>;
export { listDocs };

import { listDocRevisions as listDocRevisions_handler } from "../../../../steering/list-revisions.js";
declare const listDocRevisions: WithCallOpts<typeof listDocRevisions_handler>;
export { listDocRevisions };

import { renameDoc as renameDoc_handler } from "../../../../steering/rename-doc.js";
declare const renameDoc: WithCallOpts<typeof renameDoc_handler>;
export { renameDoc };

import { restoreDoc as restoreDoc_handler } from "../../../../steering/restore-doc.js";
declare const restoreDoc: WithCallOpts<typeof restoreDoc_handler>;
export { restoreDoc };

import { revertDocToRevision as revertDocToRevision_handler } from "../../../../steering/revert-revision.js";
declare const revertDocToRevision: WithCallOpts<typeof revertDocToRevision_handler>;
export { revertDocToRevision };

import { searchDocs as searchDocs_handler } from "../../../../steering/search.endpoint.js";
declare const searchDocs: WithCallOpts<typeof searchDocs_handler>;
export { searchDocs };

import { getSteeringTools as getSteeringTools_handler } from "../../../../steering/tools.js";
declare const getSteeringTools: WithCallOpts<typeof getSteeringTools_handler>;
export { getSteeringTools };

import { updateDoc as updateDoc_handler } from "../../../../steering/update-doc.js";
declare const updateDoc: WithCallOpts<typeof updateDoc_handler>;
export { updateDoc };


