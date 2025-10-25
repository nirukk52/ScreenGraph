import { CallOpts } from "encore.dev/api";

type Parameters<T> = T extends (...args: infer P) => unknown ? P : never;
type WithCallOpts<T extends (...args: any) => any> = (
  ...args: [...Parameters<T>, opts?: CallOpts]
) => ReturnType<T>;

import { getDoc as getDoc_handler } from "../../../../backend/steering/get-doc.js";
declare const getDoc: WithCallOpts<typeof getDoc_handler>;
export { getDoc };

import { listDocs as listDocs_handler } from "../../../../backend/steering/list-docs.js";
declare const listDocs: WithCallOpts<typeof listDocs_handler>;
export { listDocs };

import { updateDoc as updateDoc_handler } from "../../../../backend/steering/update-doc.js";
declare const updateDoc: WithCallOpts<typeof updateDoc_handler>;
export { updateDoc };


