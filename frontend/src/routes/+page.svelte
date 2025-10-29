<!--
ScreenGraph Landing Page
Retro-modern design landing page showcasing the UX drift detection platform
-->
<script lang="ts">
	import autoAnimate from '@formkit/auto-animate';
	import { Activity, GitCompare, FileText, Check } from 'lucide-svelte';
	import { RetroButton, RetroCard, RetroInput, RetroBadge } from '$lib/components';

	/** Email input for beta signup */
	let email = $state('');
	/** Show signup success message */
	let signupSuccess = $state(false);

	/**
	 * Handle beta signup form submission
	 * @param e - Form submit event
	 */
	function handleSignup(e: Event) {
		e.preventDefault();
		signupSuccess = true;
		// Reset after 3 seconds
		setTimeout(() => {
			signupSuccess = false;
			email = '';
		}, 3000);
	}

	// Animation states for phone mockups
	let phoneOffset1 = $state(0);
	let phoneOffset2 = $state(0);

	// Animate phone mockups continuously
	$effect(() => {
		const interval = setInterval(() => {
			phoneOffset1 = Math.sin(Date.now() / 1000) * 10;
			phoneOffset2 = Math.cos(Date.now() / 1000) * 10;
		}, 50);

		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>ScreenGraph – Never Miss a UX Drift Again</title>
	<meta
		name="description"
		content="Watch how your product evolves screen-by-screen. Detect broken flows, layout shifts, or hidden regressions automatically."
	/>
</svelte:head>

<div class="w-full bg-white">
	<!-- Hero Section -->
	<section class="relative overflow-hidden py-20 px-8">
		<div class="max-w-6xl mx-auto">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
				<!-- Left: Hero Content -->
				<div class="space-y-8">
					<div class="space-y-4">
						<RetroBadge variant="sky">Product Analytics</RetroBadge>
						<h1 class="text-6xl leading-tight text-[var(--color-charcoal)] font-medium">
							Never Miss a UX Drift Again.
						</h1>
						<p class="text-xl text-[var(--color-text-secondary)] leading-relaxed">
							Watch how your product evolves screen-by-screen. Detect broken flows, layout shifts,
							or hidden regressions automatically.
						</p>
					</div>
					<div class="flex flex-wrap gap-4">
						<RetroButton variant="primary" size="lg"> Detect My First Drift </RetroButton>
						<RetroButton variant="secondary" size="lg"> See How It Works </RetroButton>
					</div>
					<div class="flex flex-wrap gap-6 text-sm text-[var(--color-text-secondary)]">
						<div class="flex items-center gap-2">
							<Check class="w-4 h-4 text-[var(--color-charcoal)]" />
							<span>No SDK required</span>
						</div>
						<div class="flex items-center gap-2">
							<Check class="w-4 h-4 text-[var(--color-charcoal)]" />
							<span>iOS & Android</span>
						</div>
						<div class="flex items-center gap-2">
							<Check class="w-4 h-4 text-[var(--color-charcoal)]" />
							<span>Auto-detect changes</span>
						</div>
					</div>
				</div>

			<!-- Right: Animated Graph Visualization -->
			<div class="relative h-[500px]">
				<!-- Phone Mockup 1 -->
				<div
					class="absolute top-8 left-12 w-48 h-80 bg-white retro-shadow rounded-3xl p-4 z-10 transition-transform"
					style="transform: translateY({phoneOffset1}px)"
				>
					<div class="w-full h-full bg-[var(--color-sky-blue)] rounded-2xl p-3 space-y-2">
						<div class="h-6 bg-white/50 rounded-lg"></div>
						<div class="h-20 bg-white/70 rounded-lg"></div>
						<div class="space-y-1">
							<div class="h-3 bg-white/40 rounded"></div>
							<div class="h-3 bg-white/40 rounded w-3/4"></div>
						</div>
					</div>
				</div>

				<!-- Phone Mockup 2 -->
				<div
					class="absolute top-32 right-12 w-48 h-80 bg-white retro-shadow rounded-3xl p-4 z-10 transition-transform"
					style="transform: translateY({phoneOffset2}px)"
				>
					<div class="w-full h-full bg-[var(--color-soft-pink)] rounded-2xl p-3 space-y-2">
						<div class="h-6 bg-white/50 rounded-lg"></div>
						<div class="h-20 bg-white/70 rounded-lg"></div>
						<div class="space-y-1">
							<div class="h-3 bg-white/40 rounded"></div>
							<div class="h-3 bg-white/40 rounded w-2/3"></div>
						</div>
					</div>
				</div>

				<!-- Graph Node Indicators -->
				<div
					class="absolute top-40 left-28 w-3 h-3 bg-[var(--color-charcoal)] rounded-full z-20 animate-pulse"
				></div>
				<div
					class="absolute top-56 right-28 w-3 h-3 bg-[var(--color-sky-blue)] rounded-full z-20 animate-pulse"
					style="animation-delay: 0.5s"
				></div>
			</div>
			</div>
		</div>
	</section>

	<!-- How It Works Section -->
	<section class="py-16 px-8 bg-[var(--color-neutral-gray)]">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-12 space-y-4">
				<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">How ScreenGraph Works</h2>
				<p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
					ScreenGraph automatically maps your app, compares builds, and highlights changes so you
					never ship broken experiences.
				</p>
			</div>

			<div use:autoAnimate class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<!-- Step 1 -->
				<RetroCard variant="white" class="h-full">
					<div class="space-y-6">
						<div
							class="w-16 h-16 bg-[var(--color-sky-blue)] rounded-2xl retro-shadow-sm flex items-center justify-center"
						>
							<Activity class="w-8 h-8 text-[var(--color-charcoal)]" />
						</div>
						<div class="space-y-3">
							<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">1. Automated Crawls</h3>
							<p class="text-[var(--color-text-secondary)] leading-relaxed">
								Upload your build and ScreenGraph automatically crawls every screen, button, and flow
								in your app. No manual setup required.
							</p>
						</div>
						<div class="pt-4 space-y-2">
							<div class="flex items-start gap-2 text-sm">
								<Check class="w-4 h-4 mt-0.5 text-[var(--color-charcoal)] flex-shrink-0" />
								<span class="text-[var(--color-text-secondary)]">Deep link discovery</span>
							</div>
							<div class="flex items-start gap-2 text-sm">
								<Check class="w-4 h-4 mt-0.5 text-[var(--color-charcoal)] flex-shrink-0" />
								<span class="text-[var(--color-text-secondary)]">Navigation mapping</span>
							</div>
							<div class="flex items-start gap-2 text-sm">
								<Check class="w-4 h-4 mt-0.5 text-[var(--color-charcoal)] flex-shrink-0" />
								<span class="text-[var(--color-text-secondary)]">Screenshot capture</span>
							</div>
						</div>
					</div>
				</RetroCard>

				<!-- Step 2 -->
				<RetroCard variant="white" class="h-full">
					<div class="space-y-6">
						<div
							class="w-16 h-16 bg-[var(--color-warm-tan)] rounded-2xl retro-shadow-sm flex items-center justify-center"
						>
							<GitCompare class="w-8 h-8 text-[var(--color-charcoal)]" />
						</div>
						<div class="space-y-3">
							<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">2. Visual Graph</h3>
							<p class="text-[var(--color-text-secondary)] leading-relaxed">
								See your entire app as an interactive graph. Each node is a screen, each edge is a
								navigation path. Explore flows visually.
							</p>
						</div>
						<div class="pt-4 space-y-2">
							<div class="flex items-start gap-2 text-sm">
								<Check class="w-4 h-4 mt-0.5 text-[var(--color-charcoal)] flex-shrink-0" />
								<span class="text-[var(--color-text-secondary)]">Interactive navigation map</span>
							</div>
							<div class="flex items-start gap-2 text-sm">
								<Check class="w-4 h-4 mt-0.5 text-[var(--color-charcoal)] flex-shrink-0" />
								<span class="text-[var(--color-text-secondary)]">Flow path analysis</span>
							</div>
							<div class="flex items-start gap-2 text-sm">
								<Check class="w-4 h-4 mt-0.5 text-[var(--color-charcoal)] flex-shrink-0" />
								<span class="text-[var(--color-text-secondary)]">Dead-end detection</span>
							</div>
						</div>
					</div>
				</RetroCard>

				<!-- Step 3 -->
				<RetroCard variant="white" class="h-full">
					<div class="space-y-6">
						<div
							class="w-16 h-16 bg-[var(--color-soft-pink)] rounded-2xl retro-shadow-sm flex items-center justify-center"
						>
							<FileText class="w-8 h-8 text-[var(--color-charcoal)]" />
						</div>
						<div class="space-y-3">
							<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">3. Drift Reports</h3>
							<p class="text-[var(--color-text-secondary)] leading-relaxed">
								Compare any two builds automatically. Get instant reports on visual changes, broken
								flows, and layout regressions.
							</p>
						</div>
						<div class="pt-4 space-y-2">
							<div class="flex items-start gap-2 text-sm">
								<Check class="w-4 h-4 mt-0.5 text-[var(--color-charcoal)] flex-shrink-0" />
								<span class="text-[var(--color-text-secondary)]">Visual diff detection</span>
							</div>
							<div class="flex items-start gap-2 text-sm">
								<Check class="w-4 h-4 mt-0.5 text-[var(--color-charcoal)] flex-shrink-0" />
								<span class="text-[var(--color-text-secondary)]">Layout shift analysis</span>
							</div>
							<div class="flex items-start gap-2 text-sm">
								<Check class="w-4 h-4 mt-0.5 text-[var(--color-charcoal)] flex-shrink-0" />
								<span class="text-[var(--color-text-secondary)]">Broken link alerts</span>
							</div>
						</div>
					</div>
				</RetroCard>
			</div>
		</div>
	</section>

	<!-- Stats Section -->
	<section class="py-16 px-8">
		<div class="max-w-6xl mx-auto">
			<div use:autoAnimate class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="retro-shadow rounded-3xl p-8 bg-[var(--color-sky-blue)]">
					<div class="space-y-2">
						<div class="text-5xl text-[var(--color-charcoal)] font-medium">50+</div>
						<p class="text-[var(--color-text-secondary)]">Screens analyzed per second</p>
					</div>
				</div>

				<div class="retro-shadow rounded-3xl p-8 bg-[var(--color-warm-tan)]">
					<div class="space-y-2">
						<div class="text-5xl text-[var(--color-charcoal)] font-medium">99.9%</div>
						<p class="text-[var(--color-text-secondary)]">Drift detection accuracy</p>
					</div>
				</div>

				<div class="retro-shadow rounded-3xl p-8 bg-[var(--color-soft-pink)]">
					<div class="space-y-2">
						<div class="text-5xl text-[var(--color-charcoal)] font-medium">5min</div>
						<p class="text-[var(--color-text-secondary)]">Average time to first insight</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Use Cases / Testimonials Section -->
	<section class="py-16 px-8 bg-white">
		<div class="max-w-4xl mx-auto">
			<div class="text-center mb-12 space-y-4">
				<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">Catch What QA Can't</h2>
				<p class="text-lg text-[var(--color-text-secondary)]">
					Real teams using ScreenGraph to ship with confidence
				</p>
			</div>

			<div use:autoAnimate class="space-y-6">
				<RetroCard variant="sky">
					<div class="space-y-3">
						<h4 class="text-lg text-[var(--color-charcoal)] font-medium">
							"Caught a broken onboarding flow before release"
						</h4>
						<p class="text-[var(--color-text-secondary)]">
							Our refactor accidentally removed a navigation link. ScreenGraph flagged it
							immediately in the drift report. Would have taken us days to find manually.
						</p>
						<div class="flex items-center gap-2 pt-2">
							<div class="w-8 h-8 rounded-full bg-white border-2 border-black"></div>
							<div>
								<div class="text-sm text-[var(--color-charcoal)] font-medium">Sarah Chen</div>
								<div class="text-xs text-[var(--color-text-secondary)]">
									Product Manager, FinTech App
								</div>
							</div>
						</div>
					</div>
				</RetroCard>

				<RetroCard variant="tan">
					<div class="space-y-3">
						<h4 class="text-lg text-[var(--color-charcoal)] font-medium">
							"Layout shifts we didn't know existed"
						</h4>
						<p class="text-[var(--color-text-secondary)]">
							ScreenGraph showed us subtle UI changes across 15 screens that our tests missed. Now
							we review drifts before every release.
						</p>
						<div class="flex items-center gap-2 pt-2">
							<div class="w-8 h-8 rounded-full bg-white border-2 border-black"></div>
							<div>
								<div class="text-sm text-[var(--color-charcoal)] font-medium">Marcus Rivera</div>
								<div class="text-xs text-[var(--color-text-secondary)]">
									Engineering Lead, E-commerce
								</div>
							</div>
						</div>
					</div>
				</RetroCard>

				<RetroCard variant="pink">
					<div class="space-y-3">
						<h4 class="text-lg text-[var(--color-charcoal)] font-medium">
							"Visual regression testing on autopilot"
						</h4>
						<p class="text-[var(--color-text-secondary)]">
							We integrate ScreenGraph into CI/CD. Every PR gets a drift report. Saved us countless
							hours of manual screenshot comparisons.
						</p>
						<div class="flex items-center gap-2 pt-2">
							<div class="w-8 h-8 rounded-full bg-white border-2 border-black"></div>
							<div>
								<div class="text-sm text-[var(--color-charcoal)] font-medium">Aisha Patel</div>
								<div class="text-xs text-[var(--color-text-secondary)]">
									QA Director, Social Platform
								</div>
							</div>
						</div>
					</div>
				</RetroCard>
			</div>
		</div>
	</section>

	<!-- Beta Signup Footer -->
	<footer class="py-20 px-8 bg-[var(--color-charcoal)]">
		<div class="max-w-4xl mx-auto">
			<div class="text-center space-y-8">
				<div class="space-y-4">
					<h2 class="text-4xl text-white font-medium">Join the Beta</h2>
					<p class="text-xl text-gray-300">
						Get early access to ScreenGraph and never ship a broken flow again.
					</p>
				</div>

				<div class="max-w-md mx-auto">
					{#if signupSuccess}
						<div class="retro-shadow rounded-2xl p-6 bg-[var(--color-sky-blue)] text-center">
							<p class="text-[var(--color-charcoal)] font-medium">
								Thanks for your interest! We'll reach out to {email}
							</p>
						</div>
					{:else}
						<form onsubmit={handleSignup} class="space-y-4">
							<RetroInput
								type="email"
								placeholder="your@email.com"
								bind:value={email}
								required
							/>
							<RetroButton variant="primary" size="lg" type="submit" class="w-full">
								Request Beta Access
							</RetroButton>
						</form>
					{/if}
					<p class="text-sm text-gray-400 mt-4">
						No credit card required. iOS & Android support. Cancel anytime.
					</p>
				</div>

				<div class="pt-8 border-t border-gray-700">
					<div class="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
						<a href="/docs" class="hover:text-white transition-colors"> Documentation </a>
						<a href="/api" class="hover:text-white transition-colors"> API Reference </a>
						<a href="/pricing" class="hover:text-white transition-colors"> Pricing </a>
						<a href="/contact" class="hover:text-white transition-colors"> Contact </a>
					</div>
					<p class="text-center text-gray-500 text-sm mt-6">
						© 2025 ScreenGraph. Detect drifts, ship with confidence.
					</p>
				</div>
			</div>
		</div>
	</footer>
</div>
