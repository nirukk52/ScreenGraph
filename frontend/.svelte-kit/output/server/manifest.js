export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.CaLSGPEo.js",app:"_app/immutable/entry/app.DTBInpWI.js",imports:["_app/immutable/entry/start.CaLSGPEo.js","_app/immutable/chunks/9XIqwSww.js","_app/immutable/chunks/Cisc_5tI.js","_app/immutable/chunks/BvAXCPpv.js","_app/immutable/chunks/C5-ZfVxS.js","_app/immutable/entry/app.DTBInpWI.js","_app/immutable/chunks/BvAXCPpv.js","_app/immutable/chunks/C5-ZfVxS.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/Cisc_5tI.js","_app/immutable/chunks/Hk8OhlQV.js","_app/immutable/chunks/DMENymi9.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/run/[id]",
				pattern: /^\/run\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
