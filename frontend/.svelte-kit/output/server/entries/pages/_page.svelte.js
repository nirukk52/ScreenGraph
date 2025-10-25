import { a as attr } from "../../chunks/attributes.js";
import { e as escape_html } from "../../chunks/escaping.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let runId = "";
    let loading = false;
    $$renderer2.push(`<div class="container mx-auto p-8"><h1 class="text-3xl font-bold mb-8">ScreenGraph Agent</h1> <div class="max-w-md mx-auto"><div class="mb-4"><label for="url" class="block text-sm font-medium mb-2">Website URL</label> <input id="url" type="text"${attr("value", runId)} placeholder="https://example.com" class="w-full px-4 py-2 border rounded-lg"${attr("disabled", loading, true)}/></div> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <button${attr("disabled", !runId, true)} class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">${escape_html("Start Agent Run")}</button></div></div>`);
  });
}
export {
  _page as default
};
