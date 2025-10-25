import { x as ensure_array_like } from "../../../../chunks/index2.js";
import { a as ssr_context } from "../../../../chunks/context.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import { e as escape_html } from "../../../../chunks/escaping.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/state.svelte.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let runId = "";
    let events = [];
    onDestroy(() => {
    });
    $$renderer2.push(`<div class="container mx-auto p-8"><div class="flex justify-between items-center mb-6"><h1 class="text-3xl font-bold">Run Timeline: ${escape_html(runId)}</h1> <button class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Cancel Run</button></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="text-center">Loading events...</div>`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="space-y-4"><!--[-->`);
    const each_array = ensure_array_like(events);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let event = each_array[$$index];
      $$renderer2.push(`<div class="p-4 border rounded-lg"><div class="font-semibold">${escape_html(event.type)}</div> <div class="text-sm text-gray-600">${escape_html(event.timestamp)}</div> `);
      if (event.message) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mt-2">${escape_html(event.message)}</div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
export {
  _page as default
};
