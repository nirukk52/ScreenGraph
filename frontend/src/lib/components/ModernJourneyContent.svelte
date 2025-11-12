<!--
@component
ModernJourneyContent: Interactive developer workflow visualization.
Shows the 4-step journey from PR creation to learning/deployment.
Based on Figma DevWorkflowModern design.

Usage:
```svelte
<ModernJourneyContent />
```
-->
<script lang="ts">
import autoAnimate from "@formkit/auto-animate";
import {
  AlertCircle,
  ArrowRight,
  Brain,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-svelte";

/** Currently active step in the journey */
let activeStep = $state(0);

/** Show comparison view on impact page */
let showComparison = $state(false);

/** Journey steps configuration */
const steps = [
  { id: 0, label: "PR Created", icon: GitPullRequest },
  { id: 1, label: "Bot Analysis", icon: MessageSquare },
  { id: 2, label: "Review", icon: Users },
  { id: 3, label: "Learning", icon: Brain },
];

/** Navigate to next step */
function nextStep() {
  if (activeStep < steps.length - 1) {
    activeStep++;
  }
}

/** Navigate to previous step */
function previousStep() {
  if (activeStep > 0) {
    activeStep--;
  }
}

/** Set active step directly */
function setStep(index: number) {
  activeStep = index;
}

/** Calculate progress percentage */
const progressPercent = $derived((activeStep / (steps.length - 1)) * 100);
</script>

<div class="space-y-12">
	<!-- Header -->
	<div class="text-center space-y-4">
		<div
			class="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-sky-blue)]/20 rounded-full border border-[var(--color-sky-blue)]"
		>
			<Sparkles class="w-4 h-4 text-[var(--color-charcoal)]" />
			<span class="text-sm text-[var(--color-charcoal)]">Developer Workflow</span>
		</div>
		<h2 class="text-5xl text-[var(--color-charcoal)] font-medium">From Code to Confidence</h2>
		<p class="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
			Watch how ScreenGraph turns every PR into a visual quality checkpoint
		</p>
	</div>

	<!-- Progress Steps -->
	<div class="max-w-4xl mx-auto">
		<div class="flex items-center justify-between relative">
			<!-- Progress background line -->
			<div
				class="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -translate-y-1/2 -z-10"
			></div>
			<!-- Active progress line -->
			<div
				class="absolute top-1/2 left-0 h-0.5 bg-[var(--color-sky-blue)] -translate-y-1/2 -z-10 transition-all duration-500"
				style="width: {progressPercent}%"
			></div>

			{#each steps as step, index}
				{@const Icon = step.icon}
				{@const isActive = index <= activeStep}
				<button
					onclick={() => setStep(index)}
					class="flex flex-col items-center gap-2 transition-all {isActive
						? 'scale-100'
						: 'scale-90 opacity-50'}"
				>
					<div
						class="w-12 h-12 rounded-full flex items-center justify-center transition-all {isActive
							? 'bg-[var(--color-sky-blue)] retro-shadow-sm'
							: 'bg-white border-2 border-gray-200'}"
					>
						<Icon
							class="w-5 h-5 {isActive ? 'text-[var(--color-charcoal)]' : 'text-gray-400'}"
						/>
					</div>
					<span class="text-xs {isActive ? 'text-[var(--color-charcoal)]' : 'text-gray-400'}">
						{step.label}
					</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Content Area -->
	<div use:autoAnimate class="min-h-[400px]">
		{#if activeStep === 0}
			<!-- Step 1: PR Created -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
				<!-- Left: Code -->
				<div class="bg-white rounded-2xl p-8 retro-shadow">
					<div class="flex items-center gap-3 mb-6">
						<GitPullRequest class="w-6 h-6 text-[var(--color-charcoal)]" />
						<div>
							<h3 class="text-xl text-[var(--color-charcoal)] font-medium">PR #847</h3>
							<p class="text-sm text-[var(--color-text-secondary)]">Update checkout flow</p>
						</div>
					</div>

					<div class="bg-gray-50 rounded-xl p-4 font-mono text-sm space-y-2 mb-6">
						<div class="text-green-600">
							+ <span class="text-[var(--color-charcoal)]">Button: "Proceed to Payment"</span>
						</div>
						<div class="text-red-600">
							- <span class="text-[var(--color-charcoal)]">Button: "Continue"</span>
						</div>
						<div class="text-green-600">
							+ <span class="text-[var(--color-charcoal)]">Added discount badge</span>
						</div>
					</div>

					<div class="flex gap-2">
						<span
							class="px-3 py-1 bg-[var(--color-sky-blue)]/20 border border-[var(--color-sky-blue)] rounded-lg text-xs text-[var(--color-charcoal)]"
						>
							checkout.tsx
						</span>
						<span
							class="px-3 py-1 bg-[var(--color-warm-tan)]/20 border border-[var(--color-warm-tan)] rounded-lg text-xs text-[var(--color-charcoal)]"
						>
							button.tsx
						</span>
					</div>
				</div>

				<!-- Right: Trigger -->
				<div
					class="bg-gradient-to-br from-[var(--color-sky-blue)]/10 to-[var(--color-sky-blue)]/30 rounded-2xl p-8 retro-shadow border border-[var(--color-sky-blue)]"
				>
					<div class="flex items-center gap-3 mb-6">
						<Zap class="w-6 h-6 text-[var(--color-charcoal)]" />
						<span class="text-lg text-[var(--color-charcoal)] font-medium">Auto-Triggered</span>
					</div>
					<div class="space-y-3">
						<div class="flex items-center gap-3">
							<div class="w-2 h-2 bg-[var(--color-charcoal)] rounded-full"></div>
							<span class="text-sm text-[var(--color-charcoal)]">Commit detected</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="w-2 h-2 bg-[var(--color-charcoal)] rounded-full"></div>
							<span class="text-sm text-[var(--color-charcoal)]">Analyzing code paths</span>
						</div>
						<div class="flex items-center gap-3">
							<div class="w-2 h-2 bg-[var(--color-charcoal)] rounded-full animate-pulse"></div>
							<span class="text-sm text-[var(--color-charcoal)]">Starting focused crawl...</span>
						</div>
					</div>
				</div>
			</div>
		{:else if activeStep === 1}
			<!-- Step 2: Bot Analysis -->
			<div class="space-y-6">
				<!-- Bot Comment -->
				<div class="bg-white rounded-2xl p-8 retro-shadow">
					<div class="flex items-start justify-between mb-6">
						<div class="flex items-center gap-3">
							<div
								class="w-10 h-10 bg-[var(--color-sky-blue)] rounded-xl flex items-center justify-center retro-shadow-sm"
							>
								<MessageSquare class="w-5 h-5 text-[var(--color-charcoal)]" />
							</div>
							<div>
								<h3 class="text-lg text-[var(--color-charcoal)] font-medium">ScreenGraph Bot</h3>
								<p class="text-sm text-[var(--color-text-secondary)]">2 minutes ago</p>
							</div>
						</div>
						<span
							class="px-3 py-1 bg-[var(--color-warm-tan)]/20 border border-[var(--color-warm-tan)] rounded-lg text-xs text-[var(--color-charcoal)]"
						>
							3 drifts detected
						</span>
					</div>

					<!-- Drifts Grid -->
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<!-- Critical -->
						<div class="bg-red-50 rounded-xl p-4 border border-red-200">
							<div class="flex items-center gap-2 mb-3">
								<AlertCircle class="w-4 h-4 text-red-600" />
								<span class="text-sm text-[var(--color-charcoal)] font-medium">Critical</span>
							</div>
							<p class="text-xs text-[var(--color-text-secondary)] mb-3">
								Button moved 150px right - off-screen on mobile
							</p>
							<div class="grid grid-cols-2 gap-2">
								<div
									class="aspect-square bg-white rounded border border-red-300 flex items-center justify-center"
								>
									<div
										class="w-12 h-4 bg-[var(--color-sky-blue)] rounded text-xs flex items-center justify-center"
									>
										✓
									</div>
								</div>
								<div
									class="aspect-square bg-white rounded border border-red-300 flex items-center justify-center relative overflow-hidden"
								>
									<div
										class="w-16 h-4 bg-red-200 rounded text-xs flex items-center justify-center absolute -right-4"
									>
										✗
									</div>
								</div>
							</div>
						</div>

						<!-- Warning -->
						<div class="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
							<div class="flex items-center gap-2 mb-3">
								<Eye class="w-4 h-4 text-yellow-600" />
								<span class="text-sm text-[var(--color-charcoal)] font-medium">Minor</span>
							</div>
							<p class="text-xs text-[var(--color-text-secondary)]">
								Badge added - matches design system ✓
							</p>
						</div>

						<!-- Success -->
						<div class="bg-green-50 rounded-xl p-4 border border-green-200">
							<div class="flex items-center gap-2 mb-3">
								<CheckCircle class="w-4 h-4 text-green-600" />
								<span class="text-sm text-[var(--color-charcoal)] font-medium">Verified</span>
							</div>
							<p class="text-xs text-[var(--color-text-secondary)]">
								Text updated - no layout impact
							</p>
						</div>
					</div>

					<!-- Confidence -->
					<div class="mt-6 pt-6 border-t border-gray-200">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<Brain class="w-5 h-5 text-[var(--color-charcoal)]" />
								<span class="text-sm text-[var(--color-charcoal)] font-medium"
									>Confidence: Needs Review</span
								>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
									<div class="h-full w-3/4 bg-yellow-400 rounded-full"></div>
								</div>
								<span class="text-sm text-[var(--color-charcoal)]">75%</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if activeStep === 2}
			<!-- Step 3: Review -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
				<!-- Reviewer -->
				<div class="bg-white rounded-2xl p-8 retro-shadow">
					<div class="flex items-center gap-3 mb-6">
						<Users class="w-6 h-6 text-[var(--color-charcoal)]" />
						<h3 class="text-lg text-[var(--color-charcoal)] font-medium">Reviewer's View</h3>
					</div>

					<div class="space-y-4">
						<div class="bg-gray-50 rounded-xl p-4">
							<p class="text-sm text-[var(--color-charcoal)] mb-2">💬 Reviewer:</p>
							<p class="text-xs text-[var(--color-text-secondary)]">
								"Button looks cut off on mobile. Can you check?"
							</p>
						</div>

						<div class="flex gap-2">
							<button
								class="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-[var(--color-charcoal)] hover:bg-gray-50 transition-colors"
							>
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

				<!-- Context -->
				<div
					class="bg-gradient-to-br from-[var(--color-sky-blue)]/10 to-[var(--color-sky-blue)]/30 rounded-2xl p-8 retro-shadow border border-[var(--color-sky-blue)]"
				>
					<div class="flex items-center gap-3 mb-6">
						<Eye class="w-6 h-6 text-[var(--color-charcoal)]" />
						<h3 class="text-lg text-[var(--color-charcoal)] font-medium">Visual Context</h3>
					</div>

					<div class="space-y-3">
						<div class="flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
							<CheckCircle class="w-4 h-4" />
							Screenshots inline
						</div>
						<div class="flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
							<CheckCircle class="w-4 h-4" />
							Flow impact visible
						</div>
						<div class="flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
							<CheckCircle class="w-4 h-4" />
							Design system check
						</div>
						<div class="flex items-center gap-2 text-sm text-[var(--color-charcoal)]">
							<CheckCircle class="w-4 h-4" />
							Confidence score
						</div>
					</div>
				</div>
			</div>
		{:else if activeStep === 3}
			<!-- Step 4: Learning -->
			<div class="space-y-8">
				<!-- Merged & Learning -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div class="bg-green-100 rounded-2xl p-6 border border-green-300 retro-shadow-sm">
						<div class="flex items-center gap-3 mb-3">
							<GitCommit class="w-5 h-5 text-green-700" />
							<h3 class="text-base text-[var(--color-charcoal)] font-medium">PR Merged</h3>
						</div>
						<p class="text-sm text-[var(--color-text-secondary)]">Fixed & merged to main</p>
					</div>

					<div
						class="bg-[var(--color-sky-blue)]/30 rounded-2xl p-6 border border-[var(--color-sky-blue)] retro-shadow-sm"
					>
						<div class="flex items-center gap-3 mb-3">
							<Clock class="w-5 h-5 text-[var(--color-charcoal)]" />
							<h3 class="text-base text-[var(--color-charcoal)] font-medium">Baseline Updated</h3>
						</div>
						<p class="text-sm text-[var(--color-text-secondary)]">New reference created</p>
					</div>

					<div
						class="bg-[var(--color-warm-tan)]/30 rounded-2xl p-6 border border-[var(--color-warm-tan)] retro-shadow-sm"
					>
						<div class="flex items-center gap-3 mb-3">
							<Sparkles class="w-5 h-5 text-[var(--color-charcoal)]" />
							<h3 class="text-base text-[var(--color-charcoal)] font-medium">System Learns</h3>
						</div>
						<p class="text-sm text-[var(--color-text-secondary)]">Patterns refined</p>
					</div>
				</div>

				<!-- Stats -->
				<div class="bg-white rounded-2xl p-8 retro-shadow">
					<div class="flex items-center gap-3 mb-6">
						<Brain class="w-6 h-6 text-[var(--color-charcoal)]" />
						<h3 class="text-xl text-[var(--color-charcoal)] font-medium">
							Design System Intelligence
						</h3>
					</div>

					<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
						<div class="text-center">
							<div class="text-3xl text-[var(--color-charcoal)] mb-1">47</div>
							<div class="text-xs text-[var(--color-text-secondary)]">Components</div>
						</div>
						<div class="text-center">
							<div class="text-3xl text-[var(--color-charcoal)] mb-1">12</div>
							<div class="text-xs text-[var(--color-text-secondary)]">UX Patterns</div>
						</div>
						<div class="text-center">
							<div class="text-3xl text-[var(--color-charcoal)] mb-1">93%</div>
							<div class="text-xs text-[var(--color-text-secondary)]">Accuracy</div>
						</div>
						<div class="text-center">
							<div class="text-3xl text-[var(--color-charcoal)] mb-1">156</div>
							<div class="text-xs text-[var(--color-text-secondary)]">PRs Analyzed</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Navigation -->
	<div class="flex items-center justify-between">
		<button
			onclick={previousStep}
			disabled={activeStep === 0}
			class="px-4 py-2 text-sm text-[var(--color-charcoal)] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[var(--color-charcoal-dark)] transition-colors flex items-center gap-2"
		>
			<ChevronLeft class="w-4 h-4" />
			Previous
		</button>

		<button
			onclick={nextStep}
			disabled={activeStep === steps.length - 1}
			class="px-6 py-2 bg-[var(--color-charcoal)] text-white rounded-lg text-sm hover:bg-[var(--color-charcoal-dark)] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed retro-shadow-hover"
		>
			Next
			<ChevronRight class="w-4 h-4" />
		</button>
	</div>
</div>

