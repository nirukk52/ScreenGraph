<!--
@component
ModernJourneyFull: Complete developer workflow storytelling journey.
Shows the full 5-step process from PR creation to continuous evolution.
Based on Figma DevWorkflowStory design - the complete scrolling version.

Usage:
```svelte
<ModernJourneyFull />
```
-->
<script lang="ts">
import { RetroBadge, RetroButton } from "$lib/components";
import autoAnimate from "@formkit/auto-animate";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  GitCommit,
  GitPullRequest,
  Layers,
  MessageSquare,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Users,
  Zap,
} from "lucide-svelte";

/** Show Slack notification preview */
const showSlackPreview = $state(false);

/** Timeline scrubber position (0-10) */
const timelinePosition = $state(0);

/** Calculated confidence based on timeline */
const confidence = $derived(75 + timelinePosition * 2);

/** Calculated patterns based on timeline */
const patterns = $derived(30 + timelinePosition * 5);

/** Calculated screens based on timeline */
const screens = $derived(100 + timelinePosition * 20);
</script>

<div
	class="w-full space-y-32 py-12 bg-gradient-to-b from-[var(--color-soft-pink)]/15 via-[var(--color-neutral-gray)]/30 to-[var(--color-warm-tan)]/15"
>
	<!-- Intro -->
	<section class="text-center space-y-6">
		<div class="text-7xl mb-4">🔄</div>
		<h1 class="text-5xl text-[var(--color-charcoal)] font-medium mb-3">
			The Developer Journey
		</h1>
		<p class="text-xl text-[var(--color-text-secondary)]">
			From PR to production, ScreenGraph has your back
		</p>
	</section>

	<!-- Step 1: Developer Creates PR -->
	<section class="space-y-12 px-8">
		<div class="text-center space-y-2">
			<div class="text-5xl">👨‍💻</div>
			<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">Step 1: Create PR</h2>
			<p class="text-lg text-[var(--color-text-secondary)]">Developer pushes code changes</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
			<!-- Code Side -->
			<div class="space-y-6">
				<div class="bg-white rounded-2xl border-2 border-black p-6 retro-shadow-lg">
					<div class="flex items-center gap-3 mb-4">
						<GitPullRequest class="w-6 h-6 text-[var(--color-charcoal)]" />
						<div>
							<h3 class="text-lg text-[var(--color-charcoal)] font-medium">PR #847</h3>
							<p class="text-sm text-[var(--color-text-secondary)]">Update checkout flow UI</p>
						</div>
					</div>

					<div
						class="bg-[var(--color-neutral-gray)] rounded-xl p-4 border-2 border-black font-mono text-sm space-y-2"
					>
						<div class="text-green-600">
							+ <span class="text-[var(--color-charcoal)]">Button: "Proceed to Payment"</span>
						</div>
						<div class="text-red-600">
							- <span class="text-[var(--color-charcoal)]">Button: "Continue"</span>
						</div>
						<div class="text-green-600">
							+ <span class="text-[var(--color-charcoal)]">Added discount badge</span>
						</div>
						<div class="text-[var(--color-text-secondary)]">Modified 3 components</div>
					</div>

					<div class="mt-4 flex gap-2">
						<RetroBadge variant="sky">checkout.tsx</RetroBadge>
						<RetroBadge variant="tan">button.tsx</RetroBadge>
						<RetroBadge variant="pink">badge.tsx</RetroBadge>
					</div>
				</div>
			</div>

			<!-- Trigger Side -->
			<div class="space-y-6 flex flex-col justify-center">
				<div class="bg-[var(--color-sky-blue)] rounded-2xl border-2 border-black p-6 retro-shadow-lg">
					<div class="flex items-center gap-3 mb-4">
						<Zap class="w-6 h-6 text-[var(--color-charcoal)]" />
						<span class="text-lg text-[var(--color-charcoal)] font-medium">Auto-Trigger</span>
					</div>
					<div class="space-y-3">
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 bg-[var(--color-charcoal)] rounded-full"></div>
							<span class="text-sm text-[var(--color-charcoal)]">Commit detected</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 bg-[var(--color-charcoal)] rounded-full"></div>
							<span class="text-sm text-[var(--color-charcoal)]">Analyzing code paths</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-2 h-2 bg-[var(--color-charcoal)] rounded-full"></div>
							<span class="text-sm text-[var(--color-charcoal)]">Starting focused crawl</span>
						</div>
					</div>
				</div>

				<div class="flex justify-center">
					<div
						class="w-16 h-16 bg-[var(--color-warm-tan)] rounded-full border-2 border-black retro-shadow flex items-center justify-center animate-spin"
						style="animation-duration: 3s"
					>
						<Sparkles class="w-8 h-8 text-[var(--color-charcoal)]" />
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Arrow -->
	<div class="flex justify-center">
		<ArrowDown class="w-12 h-12 text-[var(--color-charcoal)] animate-bounce" />
	</div>

	<!-- Step 2: ScreenGraph Bot Comments -->
	<section class="space-y-12 px-8">
		<div class="text-center space-y-2">
			<div class="text-5xl">🤖</div>
			<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">Step 2: Bot Analysis</h2>
			<p class="text-lg text-[var(--color-text-secondary)]">
				Intelligent drift detection with visual proof
			</p>
		</div>

		<div class="bg-white rounded-3xl border-2 border-black p-8 retro-shadow-lg max-w-6xl mx-auto">
			<!-- Bot Header -->
			<div class="flex items-start justify-between mb-6">
				<div class="flex items-center gap-3">
					<div
						class="w-12 h-12 bg-[var(--color-sky-blue)] rounded-xl border-2 border-black retro-shadow-sm flex items-center justify-center"
					>
						<MessageSquare class="w-6 h-6 text-[var(--color-charcoal)]" />
					</div>
					<div>
						<h3 class="text-lg text-[var(--color-charcoal)] font-medium">ScreenGraph Bot</h3>
						<p class="text-sm text-[var(--color-text-secondary)]">commented 2 minutes ago</p>
					</div>
				</div>
				<RetroBadge variant="tan">3 drifts detected</RetroBadge>
			</div>

			<!-- Drift Report -->
			<div class="space-y-6">
				<!-- Critical Drift -->
				<div class="bg-red-50 rounded-2xl border-2 border-black p-6 retro-shadow">
					<div class="flex items-start gap-4">
						<div
							class="w-10 h-10 bg-red-200 rounded-lg border-2 border-black retro-shadow-sm flex items-center justify-center flex-shrink-0"
						>
							<AlertCircle class="w-5 h-5 text-red-700" />
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-2">
								<h4 class="text-base text-[var(--color-charcoal)] font-medium">
									Critical: Button Off-Screen
								</h4>
								<span
									class="px-2 py-0.5 bg-red-200 border border-red-400 rounded text-xs text-[var(--color-charcoal)]"
									>Visual</span
								>
							</div>
							<p class="text-sm text-[var(--color-text-secondary)] mb-4">
								Checkout button moved 150px right - now partially off-screen on mobile
							</p>

							<!-- Side by side screenshots -->
							<div class="grid grid-cols-2 gap-4">
								<div class="space-y-2">
									<p class="text-xs text-[var(--color-text-secondary)]">Before</p>
									<div
										class="aspect-[9/16] bg-white rounded-lg border-2 border-black retro-shadow-sm flex items-center justify-center"
									>
										<div
											class="w-24 h-10 bg-[var(--color-sky-blue)] rounded-lg border-2 border-black flex items-center justify-center text-xs"
										>
											Continue
										</div>
									</div>
								</div>
								<div class="space-y-2">
									<p class="text-xs text-[var(--color-text-secondary)]">After</p>
									<div
										class="aspect-[9/16] bg-white rounded-lg border-2 border-black retro-shadow-sm flex items-center justify-center relative overflow-hidden"
									>
										<div
											class="w-32 h-10 bg-[var(--color-soft-pink)] rounded-lg border-2 border-black flex items-center justify-center text-xs absolute -right-8"
										>
											Proceed to Payment
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Warning Drift -->
				<div class="bg-yellow-50 rounded-2xl border-2 border-black p-6 retro-shadow">
					<div class="flex items-start gap-4">
						<div
							class="w-10 h-10 bg-yellow-200 rounded-lg border-2 border-black retro-shadow-sm flex items-center justify-center flex-shrink-0"
						>
							<Eye class="w-5 h-5 text-yellow-700" />
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-2">
								<h4 class="text-base text-[var(--color-charcoal)] font-medium">
									Minor: Badge Added
								</h4>
								<span
									class="px-2 py-0.5 bg-yellow-200 border border-yellow-400 rounded text-xs text-[var(--color-charcoal)]"
									>Flow</span
								>
							</div>
							<p class="text-sm text-[var(--color-text-secondary)]">
								New discount badge added - matches design system ✓
							</p>
						</div>
					</div>
				</div>

				<!-- Info -->
				<div class="bg-green-50 rounded-2xl border-2 border-black p-6 retro-shadow">
					<div class="flex items-start gap-4">
						<div
							class="w-10 h-10 bg-green-200 rounded-lg border-2 border-black retro-shadow-sm flex items-center justify-center flex-shrink-0"
						>
							<CheckCircle class="w-5 h-5 text-green-700" />
						</div>
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-2">
								<h4 class="text-base text-[var(--color-charcoal)] font-medium">
									Verified: Text Updated
								</h4>
								<span
									class="px-2 py-0.5 bg-green-200 border border-green-400 rounded text-xs text-[var(--color-charcoal)]"
									>Content</span
								>
							</div>
							<p class="text-sm text-[var(--color-text-secondary)]">
								Button text changed - no layout impact
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Bot Confidence Vote -->
			<div class="mt-6 pt-6 border-t-2 border-black">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<Brain class="w-5 h-5 text-[var(--color-charcoal)]" />
						<span class="text-sm text-[var(--color-charcoal)] font-medium">Bot Confidence:</span>
						<span
							class="px-3 py-1 bg-[var(--color-warm-tan)] border border-[var(--color-warm-tan)] rounded-lg text-xs text-[var(--color-charcoal)]"
							>Needs Review</span
						>
					</div>
					<div class="flex items-center gap-2">
						<ThumbsDown class="w-5 h-5 text-red-600" />
						<div
							class="w-32 h-2 bg-[var(--color-neutral-gray)] rounded-full border border-black overflow-hidden"
						>
							<div class="h-full w-3/4 bg-yellow-400"></div>
						</div>
						<span class="text-sm text-[var(--color-charcoal)]">75%</span>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Arrow -->
	<div class="flex justify-center">
		<ArrowDown class="w-12 h-12 text-[var(--color-charcoal)] animate-bounce" />
	</div>

	<!-- Step 3: PR Review Loop -->
	<section class="space-y-12 px-8">
		<div class="text-center space-y-2">
			<div class="text-5xl">👥</div>
			<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">Step 3: Review Loop</h2>
			<p class="text-lg text-[var(--color-text-secondary)]">
				Visual context meets code context
			</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
			<!-- Code Review -->
			<div class="bg-white rounded-2xl border-2 border-black p-6 retro-shadow-lg">
				<div class="flex items-center gap-3 mb-4">
					<Users class="w-6 h-6 text-[var(--color-charcoal)]" />
					<h3 class="text-lg text-[var(--color-charcoal)] font-medium">Reviewer's View</h3>
				</div>

				<div class="space-y-4">
					<div class="bg-[var(--color-neutral-gray)] rounded-xl p-4 border-2 border-black">
						<p class="text-sm text-[var(--color-charcoal)] mb-2">💬 Reviewer comment:</p>
						<p class="text-xs text-[var(--color-text-secondary)]">
							"Button looks cut off on mobile. Can you check the margin?"
						</p>
					</div>

					<div class="flex gap-2">
						<button
							class="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-[var(--color-charcoal)] hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
						>
							<MessageSquare class="w-4 h-4" />
							Comment
						</button>
						<button
							class="flex-1 px-4 py-2 bg-[var(--color-charcoal)] text-white rounded-lg text-sm hover:bg-[var(--color-charcoal-dark)] transition-colors"
						>
							Request Changes
						</button>
					</div>
				</div>
			</div>

			<!-- Visual Context -->
			<div
				class="bg-[var(--color-sky-blue)] rounded-2xl border-2 border-black p-6 retro-shadow-lg"
			>
				<div class="flex items-center gap-3 mb-4">
					<Eye class="w-6 h-6 text-[var(--color-charcoal)]" />
					<h3 class="text-lg text-[var(--color-charcoal)] font-medium">ScreenGraph Context</h3>
				</div>

				<div class="space-y-3">
					<div class="flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
						<CheckCircle class="w-4 h-4" />
						Screenshots attached inline
					</div>
					<div class="flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
						<CheckCircle class="w-4 h-4" />
						Flow diagram shows impact
					</div>
					<div class="flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
						<CheckCircle class="w-4 h-4" />
						Design system analysis
					</div>
					<div class="flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
						<CheckCircle class="w-4 h-4" />
						Confidence score visible
					</div>
				</div>
			</div>
		</div>

		<!-- Slack Integration Preview -->
		<div class="text-center">
			<RetroButton
				variant={showSlackPreview ? 'secondary' : 'accent'}
				size="lg"
				onclick={() => (showSlackPreview = !showSlackPreview)}
			>
				{showSlackPreview ? '👁️ Hide' : '💬 Show'} Slack Notification
			</RetroButton>

			{#if showSlackPreview}
				<div use:autoAnimate class="mt-6">
					<div
						class="bg-white rounded-2xl border-2 border-black p-6 retro-shadow-lg max-w-2xl mx-auto"
					>
						<div class="flex items-start gap-4">
							<div
								class="w-12 h-12 bg-purple-200 rounded-lg border-2 border-black retro-shadow-sm flex items-center justify-center flex-shrink-0"
							>
								<span class="text-2xl">🤖</span>
							</div>
							<div class="flex-1 text-left">
								<div class="mb-2">
									<span class="text-sm text-[var(--color-charcoal)] font-medium"
										>ScreenGraph Bot</span
									>
									<span class="text-xs text-[var(--color-text-secondary)] ml-2">2:34 PM</span>
								</div>
								<p class="text-sm text-[var(--color-charcoal)] mb-3">
									🚨 <strong>PR #847</strong> has critical UI drift detected
								</p>
								<div
									class="bg-[var(--color-neutral-gray)] rounded-lg p-3 border border-black text-xs space-y-1"
								>
									<div>• Button off-screen on mobile (Critical)</div>
									<div>• New badge added (Approved)</div>
									<div>• Text updated (Verified)</div>
								</div>
								<div class="mt-3 flex gap-2">
									<button
										class="px-3 py-1 bg-[var(--color-sky-blue)] border-2 border-black rounded-lg text-xs retro-shadow-sm"
									>
										View PR
									</button>
									<button
										class="px-3 py-1 bg-[var(--color-soft-pink)] border-2 border-black rounded-lg text-xs retro-shadow-sm"
									>
										See Screenshots
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Arrow -->
	<div class="flex justify-center">
		<ArrowDown class="w-12 h-12 text-[var(--color-charcoal)] animate-bounce" />
	</div>

	<!-- Step 4: Baseline Learning -->
	<section class="space-y-12 px-8">
		<div class="text-center space-y-2">
			<div class="text-5xl">🎓</div>
			<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">Step 4: Learn & Adapt</h2>
			<p class="text-lg text-[var(--color-text-secondary)]">
				Accepted PRs become the new baseline
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
			<!-- PR Merged -->
			<div class="bg-green-100 rounded-2xl border-2 border-black p-6 retro-shadow-lg">
				<div class="flex items-center gap-3 mb-4">
					<div
						class="w-10 h-10 bg-green-300 rounded-lg border-2 border-black retro-shadow-sm flex items-center justify-center"
					>
						<GitCommit class="w-5 h-5 text-green-800" />
					</div>
					<h3 class="text-base text-[var(--color-charcoal)] font-medium">PR Merged</h3>
				</div>
				<p class="text-sm text-[var(--color-text-secondary)]">
					After fixes, PR #847 merged to main
				</p>
			</div>

			<!-- Baseline Updated -->
			<div
				class="bg-[var(--color-sky-blue)] rounded-2xl border-2 border-black p-6 retro-shadow-lg"
			>
				<div class="flex items-center gap-3 mb-4">
					<div
						class="w-10 h-10 bg-white rounded-lg border-2 border-black retro-shadow-sm flex items-center justify-center"
					>
						<Layers class="w-5 h-5 text-[var(--color-charcoal)]" />
					</div>
					<h3 class="text-base text-[var(--color-charcoal)] font-medium">Baseline Updated</h3>
				</div>
				<p class="text-sm text-[var(--color-text-secondary)]">
					New screenshots become reference for future comparisons
				</p>
			</div>

			<!-- Design System -->
			<div
				class="bg-[var(--color-warm-tan)] rounded-2xl border-2 border-black p-6 retro-shadow-lg"
			>
				<div class="flex items-center gap-3 mb-4">
					<div
						class="w-10 h-10 bg-white rounded-lg border-2 border-black retro-shadow-sm flex items-center justify-center"
					>
						<Sparkles class="w-5 h-5 text-[var(--color-charcoal)]" />
					</div>
					<h3 class="text-base text-[var(--color-charcoal)] font-medium">System Learns</h3>
				</div>
				<p class="text-sm text-[var(--color-text-secondary)]">
					Bot refines understanding of your design patterns
				</p>
			</div>
		</div>

		<!-- Design Fingerprint -->
		<div class="bg-white rounded-3xl border-2 border-black p-8 retro-shadow-lg max-w-6xl mx-auto">
			<div class="flex items-center gap-3 mb-6">
				<Brain class="w-6 h-6 text-[var(--color-charcoal)]" />
				<h3 class="text-xl text-[var(--color-charcoal)] font-medium">
					Design System Fingerprint
				</h3>
			</div>

			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div
					class="bg-[var(--color-neutral-gray)] rounded-xl p-4 border-2 border-black retro-shadow-sm text-center"
				>
					<div class="text-2xl text-[var(--color-charcoal)] mb-1">47</div>
					<div class="text-xs text-[var(--color-text-secondary)]">Components Learned</div>
				</div>
				<div
					class="bg-[var(--color-neutral-gray)] rounded-xl p-4 border-2 border-black retro-shadow-sm text-center"
				>
					<div class="text-2xl text-[var(--color-charcoal)] mb-1">12</div>
					<div class="text-xs text-[var(--color-text-secondary)]">UX Patterns</div>
				</div>
				<div
					class="bg-[var(--color-neutral-gray)] rounded-xl p-4 border-2 border-black retro-shadow-sm text-center"
				>
					<div class="text-2xl text-[var(--color-charcoal)] mb-1">93%</div>
					<div class="text-xs text-[var(--color-text-secondary)]">Accuracy</div>
				</div>
				<div
					class="bg-[var(--color-neutral-gray)] rounded-xl p-4 border-2 border-black retro-shadow-sm text-center"
				>
					<div class="text-2xl text-[var(--color-charcoal)] mb-1">156</div>
					<div class="text-xs text-[var(--color-text-secondary)]">PRs Analyzed</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Arrow -->
	<div class="flex justify-center">
		<ArrowDown class="w-12 h-12 text-[var(--color-charcoal)] animate-bounce" />
	</div>

	<!-- Step 5: Continuous Evolution -->
	<section class="space-y-12 px-8">
		<div class="text-center space-y-2">
			<div class="text-5xl">♾️</div>
			<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">
				Step 5: Continuous Evolution
			</h2>
			<p class="text-lg text-[var(--color-text-secondary)]">
				System gets smarter with every PR
			</p>
		</div>

		<!-- Timeline Scrubber -->
		<div class="bg-white rounded-3xl border-2 border-black p-8 retro-shadow-lg max-w-6xl mx-auto">
			<div class="flex items-center justify-between mb-6">
				<div class="flex items-center gap-3">
					<Clock class="w-6 h-6 text-[var(--color-charcoal)]" />
					<h3 class="text-xl text-[var(--color-charcoal)] font-medium">Time Travel</h3>
				</div>
				<RetroBadge variant="sky">PR #{845 + timelinePosition}</RetroBadge>
			</div>

			<!-- Timeline -->
			<div class="relative mb-8">
				<div class="h-2 bg-[var(--color-neutral-gray)] rounded-full border-2 border-black relative">
					<div
						class="h-full bg-[var(--color-sky-blue)] rounded-full transition-all duration-300"
						style="width: {(timelinePosition / 10) * 100}%"
					></div>
				</div>
				<input
					type="range"
					min="0"
					max="10"
					bind:value={timelinePosition}
					class="absolute inset-0 w-full opacity-0 cursor-pointer"
				/>

				<!-- Timeline markers -->
				<div class="flex justify-between mt-2 text-xs text-[var(--color-text-secondary)]">
					<span>Jan 1</span>
					<span>Today</span>
				</div>
			</div>

			<!-- Evolution Stats -->
			<div class="grid grid-cols-3 gap-4">
				<div class="text-center">
					<div class="text-3xl text-[var(--color-charcoal)] mb-1">{confidence}%</div>
					<div class="text-sm text-[var(--color-text-secondary)]">Confidence</div>
				</div>
				<div class="text-center">
					<div class="text-3xl text-[var(--color-charcoal)] mb-1">{patterns}</div>
					<div class="text-sm text-[var(--color-text-secondary)]">Patterns</div>
				</div>
				<div class="text-center">
					<div class="text-3xl text-[var(--color-charcoal)] mb-1">{screens}</div>
					<div class="text-sm text-[var(--color-text-secondary)]">Screens</div>
				</div>
			</div>
		</div>

		<!-- Trust Calibration Loop -->
		<div
			class="bg-[var(--color-soft-pink)] rounded-3xl border-2 border-black p-8 retro-shadow-lg max-w-6xl mx-auto"
		>
			<div class="flex items-center gap-3 mb-6">
				<TrendingUp class="w-6 h-6 text-[var(--color-charcoal)]" />
				<h3 class="text-xl text-[var(--color-charcoal)] font-medium">Trust Calibration Loop</h3>
			</div>

			<div class="space-y-4">
				<div class="flex items-center gap-4">
					<div class="flex-1 space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-[var(--color-charcoal)]">False Positives</span>
							<span class="text-[var(--color-charcoal)]">15% → 3%</span>
						</div>
						<div class="h-2 bg-white rounded-full border-2 border-black overflow-hidden">
							<div class="h-full bg-green-500" style="width: 97%"></div>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-4">
					<div class="flex-1 space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-[var(--color-charcoal)]">Auto-Approvals</span>
							<span class="text-[var(--color-charcoal)]">20% → 65%</span>
						</div>
						<div class="h-2 bg-white rounded-full border-2 border-black overflow-hidden">
							<div class="h-full bg-[var(--color-sky-blue)]" style="width: 65%"></div>
						</div>
					</div>
				</div>

				<div class="flex items-center gap-4">
					<div class="flex-1 space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-[var(--color-charcoal)]">Review Time Saved</span>
							<span class="text-[var(--color-charcoal)]">45% → 87%</span>
						</div>
						<div class="h-2 bg-white rounded-full border-2 border-black overflow-hidden">
							<div class="h-full bg-[var(--color-warm-tan)]" style="width: 87%"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Final Summary -->
	<section class="text-center space-y-8 pb-16 px-8">
		<div class="space-y-6">
			<div class="text-7xl">🎉</div>
			<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">Your AI Design Partner</h2>
			<p class="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
				ScreenGraph learns your design system, catches regressions early, and helps your team ship
				with confidence.
			</p>
		</div>

		<div class="flex flex-wrap justify-center gap-4 pt-8">
			<div class="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border-2 border-black retro-shadow">
				<CheckCircle class="w-5 h-5 text-green-600" />
				<span class="text-sm text-[var(--color-charcoal)]">Automated drift detection</span>
			</div>
			<div class="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border-2 border-black retro-shadow">
				<CheckCircle class="w-5 h-5 text-green-600" />
				<span class="text-sm text-[var(--color-charcoal)]">PR-integrated reviews</span>
			</div>
			<div class="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl border-2 border-black retro-shadow">
				<CheckCircle class="w-5 h-5 text-green-600" />
				<span class="text-sm text-[var(--color-charcoal)]">Continuous learning</span>
			</div>
		</div>
	</section>
</div>

