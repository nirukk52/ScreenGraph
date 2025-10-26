<script lang="ts">
import { onMount } from "svelte";
import autoAnimate from "@formkit/auto-animate";
import { goto } from "$app/navigation";
import { getEncoreClient } from "$lib/getEncoreClient";
import {
  DEFAULT_APK_PATH,
  DEFAULT_APPIUM_SERVER_URL,
  DEFAULT_PACKAGE_NAME,
  DEFAULT_APP_ACTIVITY,
} from "$lib/constants";

let isLoading = $state(true);
let showContent = $state(false);
let isStartingRun = $state(false);
let startError = $state("");
let lastRunId = $state("");

onMount(() => {
  const timer = setTimeout(() => {
    isLoading = false;
    showContent = true;
  }, 500);

  return () => clearTimeout(timer);
});

/** Kicks off the default demo run and routes the user to the live timeline. */
async function handleConnect() {
  if (isStartingRun) {
    return;
  }

  isStartingRun = true;
  startError = "";

  try {
    const client = getEncoreClient();
    const response = await client.run.start({
      apkPath: DEFAULT_APK_PATH,
      appiumServerUrl: DEFAULT_APPIUM_SERVER_URL,
      packageName: DEFAULT_PACKAGE_NAME,
      appActivity: DEFAULT_APP_ACTIVITY,
    });

    lastRunId = response.runId;
    await goto(`/run/${response.runId}`);
  } catch (error) {
    console.error("Failed to start run", error);
    startError = error instanceof Error ? error.message : "Unknown error starting run";
  } finally {
    isStartingRun = false;
  }
}
</script>

<svelte:head>
	<title>ScreenGraph</title>
	<meta name="description" content="ScreenGraph – a living map of your mobile app." />
</svelte:head>

<div class="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
	<main class="flex-1 flex items-center justify-center px-6 py-16">
		<div use:autoAnimate class="w-full max-w-5xl mx-auto">
			{#if isLoading}
				<div class="grid gap-8">
					<div class="h-32 rounded-3xl bg-white/10 animate-pulse"></div>
					<div class="h-12 w-3/4 rounded-2xl bg-white/10 animate-pulse"></div>
					<div class="h-16 w-60 rounded-full bg-white/10 animate-pulse"></div>
				</div>
			{:else if showContent}
				<section class="grid gap-10 text-center">
					<div class="space-y-6">
						<h1 class="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none">
							<span class="bg-gradient-to-r from-sky-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
								ScreenGraph
							</span>
						</h1>
						<p class="text-xl sm:text-2xl text-slate-300 max-w-3xl mx-auto">
							A living map of your mobile app.
						</p>
					</div>

                    <div class="flex flex-col items-center gap-4">
                        <button
                            onclick={handleConnect}
                            class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-4 text-lg font-semibold text-slate-900 shadow-lg shadow-sky-500/30 transition-transform duration-200 hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 disabled:opacity-60 disabled:hover:scale-100"
                            disabled={isStartingRun}
                        >
                            {isStartingRun ? 'Connecting…' : 'Connect Your App'}
                        </button>

                        {#if startError}
                            <p class="text-sm text-red-300">{startError}</p>
                        {/if}

                        {#if lastRunId}
                            <p class="text-xs text-slate-400">Last run ID: {lastRunId}</p>
                        {/if}
                    </div>

					<div class="grid gap-6 sm:grid-cols-3 text-sm text-slate-400">
						<div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
							<h2 class="text-lg font-semibold text-slate-100">SSR Ready</h2>
							<p>Hydrates instantly with zero client-side fetches.</p>
						</div>
						<div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
							<h2 class="text-lg font-semibold text-slate-100">Tailwind CSS</h2>
							<p>Utility-first styling with gradient backgrounds.</p>
						</div>
						<div class="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
							<h2 class="text-lg font-semibold text-slate-100">AutoAnimate</h2>
							<p>Hero transitions glide in without manual animation logic.</p>
						</div>
					</div>
				</section>
			{/if}
		</div>
	</main>

	<footer class="sticky bottom-0 border-t border-white/10 bg-slate-950/80 py-6 text-center text-sm text-slate-400 backdrop-blur">
		© ScreenGraph 2025
	</footer>
</div>


