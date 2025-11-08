<!--
@component
TabSection: A tabbed navigation component with retro-modern styling.
Displays Modern Journey and Components tabs with styled content panels.

Usage:
```svelte
<TabSection />
```
-->
<script lang="ts">
	import { Activity, GitCompare, FileText, Package } from 'lucide-svelte';
	import { RetroButton, RetroCard, RetroInput, RetroBadge } from '$lib/components';

	/** Currently active tab: 'journey' or 'components' */
	let activeTab = $state<'journey' | 'components'>('journey');

	/** Handle tab button click */
	function setActiveTab(tab: 'journey' | 'components') {
		activeTab = tab;
	}
</script>

<section class="py-16 px-8 bg-white">
	<div class="max-w-6xl mx-auto">
		<!-- Tab Navigation -->
		<div class="mb-12">
			<div class="flex gap-4 border-b-2 border-[var(--color-charcoal)]">
				<button
					onclick={() => setActiveTab('journey')}
					class="px-8 py-4 text-lg font-medium transition-all rounded-t-xl {activeTab === 'journey' ? 'bg-[var(--color-sky-blue)] retro-shadow-sm -mb-0.5' : 'hover:bg-[var(--color-neutral-gray)]'}"
				>
					<span class="flex items-center gap-2 text-[var(--color-charcoal)]">
						<GitCompare class="w-5 h-5" />
						Modern Journey
					</span>
				</button>
				<button
					onclick={() => setActiveTab('components')}
					class="px-8 py-4 text-lg font-medium transition-all rounded-t-xl {activeTab === 'components' ? 'bg-[var(--color-warm-tan)] retro-shadow-sm -mb-0.5' : 'hover:bg-[var(--color-neutral-gray)]'}"
				>
					<span class="flex items-center gap-2 text-[var(--color-charcoal)]">
						<Package class="w-5 h-5" />
						Components
					</span>
				</button>
			</div>
		</div>

		<!-- Tab Panels -->
		<div class="min-h-[500px]">
			{#if activeTab === 'journey'}
				<!-- Modern Journey Content -->
				<div class="space-y-12">
					<div class="text-center space-y-4">
						<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">
							Your Path to Drift-Free UX
						</h2>
						<p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
							Follow our streamlined workflow to catch every visual regression before your users do.
						</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
						<!-- Step 1: Upload -->
						<RetroCard variant="sky">
							<div class="space-y-4">
								<div
									class="w-12 h-12 bg-white rounded-xl retro-shadow-sm flex items-center justify-center"
								>
									<Activity class="w-6 h-6 text-[var(--color-charcoal)]" />
								</div>
								<div class="space-y-2">
									<h3 class="text-xl text-[var(--color-charcoal)] font-medium">Upload Build</h3>
									<p class="text-[var(--color-text-secondary)]">
										Drop your APK or IPA file. ScreenGraph starts analyzing immediately.
									</p>
								</div>
								<div class="pt-2">
									<RetroBadge variant="sky">2 minutes setup</RetroBadge>
								</div>
							</div>
						</RetroCard>

						<!-- Step 2: Explore -->
						<RetroCard variant="tan">
							<div class="space-y-4">
								<div
									class="w-12 h-12 bg-white rounded-xl retro-shadow-sm flex items-center justify-center"
								>
									<GitCompare class="w-6 h-6 text-[var(--color-charcoal)]" />
								</div>
								<div class="space-y-2">
									<h3 class="text-xl text-[var(--color-charcoal)] font-medium">Explore Graph</h3>
									<p class="text-[var(--color-text-secondary)]">
										Navigate your app's screen graph. See every path, every screen, every transition.
									</p>
								</div>
								<div class="pt-2">
									<RetroBadge variant="tan">Interactive visualization</RetroBadge>
								</div>
							</div>
						</RetroCard>

						<!-- Step 3: Compare -->
						<RetroCard variant="pink">
							<div class="space-y-4">
								<div
									class="w-12 h-12 bg-white rounded-xl retro-shadow-sm flex items-center justify-center"
								>
									<FileText class="w-6 h-6 text-[var(--color-charcoal)]" />
								</div>
								<div class="space-y-2">
									<h3 class="text-xl text-[var(--color-charcoal)] font-medium">Review Drifts</h3>
									<p class="text-[var(--color-text-secondary)]">
										Get instant diff reports. See exactly what changed between builds.
									</p>
								</div>
								<div class="pt-2">
									<RetroBadge variant="pink">Automated reports</RetroBadge>
								</div>
							</div>
						</RetroCard>
					</div>

					<!-- Integration Options -->
					<div class="retro-shadow rounded-3xl p-8 bg-[var(--color-neutral-gray)]">
						<h3 class="text-2xl text-[var(--color-charcoal)] font-medium mb-6">
							Integrate Anywhere
						</h3>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div class="space-y-2">
								<div class="text-lg font-medium text-[var(--color-charcoal)]">CI/CD Pipeline</div>
								<p class="text-sm text-[var(--color-text-secondary)]">
									GitHub Actions, GitLab CI, Jenkins - plug in and go.
								</p>
							</div>
							<div class="space-y-2">
								<div class="text-lg font-medium text-[var(--color-charcoal)]">Slack Alerts</div>
								<p class="text-sm text-[var(--color-text-secondary)]">
									Get drift notifications directly in your team channel.
								</p>
							</div>
							<div class="space-y-2">
								<div class="text-lg font-medium text-[var(--color-charcoal)]">REST API</div>
								<p class="text-sm text-[var(--color-text-secondary)]">
									Full programmatic access for custom workflows.
								</p>
							</div>
						</div>
					</div>
				</div>
			{:else if activeTab === 'components'}
				<!-- Components Tab Content -->
				<div class="space-y-12">
					<div class="text-center space-y-4">
						<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">
							Retro-Modern Design System
						</h2>
						<p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
							Built with bold shadows, vibrant pastels, and brutalist aesthetics for a unique visual
							identity.
						</p>
					</div>

					<!-- Color Palette -->
					<div class="space-y-6">
						<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">Color Palette</h3>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div class="retro-shadow rounded-2xl p-6 bg-[var(--color-sky-blue)]">
								<div class="text-sm font-medium text-[var(--color-charcoal)] mb-2">Sky Blue</div>
								<div class="text-xs text-[var(--color-text-secondary)]">#B4D4E1</div>
							</div>
							<div class="retro-shadow rounded-2xl p-6 bg-[var(--color-warm-tan)]">
								<div class="text-sm font-medium text-[var(--color-charcoal)] mb-2">Warm Tan</div>
								<div class="text-xs text-[var(--color-text-secondary)]">#D9B89C</div>
							</div>
							<div class="retro-shadow rounded-2xl p-6 bg-[var(--color-soft-pink)]">
								<div class="text-sm font-medium text-[var(--color-charcoal)] mb-2">Soft Pink</div>
								<div class="text-xs text-[var(--color-text-secondary)]">#E5C9C9</div>
							</div>
							<div class="retro-shadow rounded-2xl p-6 bg-[var(--color-charcoal)]">
								<div class="text-sm font-medium text-white mb-2">Charcoal</div>
								<div class="text-xs text-gray-300">#2D2D2D</div>
							</div>
						</div>
					</div>

					<!-- Buttons -->
					<div class="space-y-6">
						<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">Buttons</h3>
						<div class="flex flex-wrap gap-4">
							<RetroButton variant="primary">Primary Action</RetroButton>
							<RetroButton variant="secondary">Secondary Action</RetroButton>
							<RetroButton variant="accent">Accent Action</RetroButton>
							<RetroButton variant="success">Success Action</RetroButton>
						</div>
						<div class="flex flex-wrap gap-4">
							<RetroButton variant="primary" size="sm">Small</RetroButton>
							<RetroButton variant="primary" size="md">Medium</RetroButton>
							<RetroButton variant="primary" size="lg">Large</RetroButton>
						</div>
					</div>

					<!-- Cards -->
					<div class="space-y-6">
						<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">Cards</h3>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<RetroCard
								variant="sky"
								title="Sky Card"
								description="Perfect for informational content and secondary features."
							/>
							<RetroCard
								variant="tan"
								title="Tan Card"
								description="Great for highlighting important sections and calls-to-action."
							/>
							<RetroCard
								variant="pink"
								title="Pink Card"
								description="Ideal for testimonials, feedback, and success messages."
							/>
						</div>
					</div>

					<!-- Badges -->
					<div class="space-y-6">
						<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">Badges</h3>
						<div class="flex flex-wrap gap-4">
							<RetroBadge variant="sky">Product Analytics</RetroBadge>
							<RetroBadge variant="tan">Beta Access</RetroBadge>
							<RetroBadge variant="pink">New Feature</RetroBadge>
							<RetroBadge variant="white">Default</RetroBadge>
						</div>
					</div>

					<!-- Typography -->
					<div class="space-y-6">
						<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">Typography</h3>
						<div class="space-y-4">
							<div>
								<h1 class="text-6xl text-[var(--color-charcoal)] font-medium">
									Heading 1 - Display
								</h1>
								<p class="text-sm text-[var(--color-text-secondary)] mt-2">
									Used for hero sections and primary headlines
								</p>
							</div>
							<div>
								<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">
									Heading 2 - Section
								</h2>
								<p class="text-sm text-[var(--color-text-secondary)] mt-2">
									Used for section titles and major divisions
								</p>
							</div>
							<div>
								<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">Heading 3 - Card</h3>
								<p class="text-sm text-[var(--color-text-secondary)] mt-2">
									Used for card titles and sub-sections
								</p>
							</div>
							<div>
								<p class="text-xl text-[var(--color-text-secondary)] leading-relaxed">
									Body Large - Used for introductory paragraphs and lead text. Provides comfortable
									reading at 20px with relaxed line height.
								</p>
							</div>
							<div>
								<p class="text-base text-[var(--color-text-secondary)]">
									Body Medium - Standard body text at 16px. Used for most content throughout the
									application.
								</p>
							</div>
						</div>
					</div>

					<!-- Shadows & Effects -->
					<div class="space-y-6">
						<h3 class="text-2xl text-[var(--color-charcoal)] font-medium">Shadows & Effects</h3>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div class="retro-shadow-sm rounded-2xl p-6 bg-white">
								<div class="text-lg font-medium text-[var(--color-charcoal)] mb-2">Small Shadow</div>
								<div class="text-sm text-[var(--color-text-secondary)]">
									4px offset, 2px border - for subtle elevation
								</div>
							</div>
							<div class="retro-shadow rounded-2xl p-6 bg-white">
								<div class="text-lg font-medium text-[var(--color-charcoal)] mb-2">
									Standard Shadow
								</div>
								<div class="text-sm text-[var(--color-text-secondary)]">
									6px offset, 2px border - for cards and panels
								</div>
							</div>
							<div class="retro-shadow-lg rounded-2xl p-6 bg-white">
								<div class="text-lg font-medium text-[var(--color-charcoal)] mb-2">Large Shadow</div>
								<div class="text-sm text-[var(--color-text-secondary)]">
									8px offset, 2px border - for modals and emphasis
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

