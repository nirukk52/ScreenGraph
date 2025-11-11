<!--
Components Page
Design system showcase and component library
-->
<script lang="ts">
import { RetroBadge, RetroButton, RetroCard } from "$lib/components";
</script>

<svelte:head>
	<title>Components – ScreenGraph Design System</title>
	<meta
		name="description"
		content="Explore the retro-modern design system with color palettes, components, and design tokens."
	/>
</svelte:head>

<div class="w-full bg-white py-16 px-8">
	<div class="max-w-6xl mx-auto space-y-12">
		<!-- Header -->
		<div class="text-center space-y-4">
			<h1 class="text-5xl text-[var(--color-charcoal)] font-medium">
				Retro-Modern Design System
			</h1>
			<p class="text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto">
				Built with bold shadows, vibrant pastels, and brutalist aesthetics for a unique visual
				identity.
			</p>
		</div>

		<!-- Color Palette -->
		<section class="space-y-6">
			<h2 class="text-2xl text-[var(--color-charcoal)] font-medium">Color Palette</h2>
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
		</section>

		<!-- Buttons -->
		<section class="space-y-6">
			<h2 class="text-2xl text-[var(--color-charcoal)] font-medium">Buttons</h2>
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
		</section>

		<!-- Cards -->
		<section class="space-y-6">
			<h2 class="text-2xl text-[var(--color-charcoal)] font-medium">Cards</h2>
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
		</section>

		<!-- Badges -->
		<section class="space-y-6">
			<h2 class="text-2xl text-[var(--color-charcoal)] font-medium">Badges</h2>
			<div class="flex flex-wrap gap-4">
				<RetroBadge variant="sky">Product Analytics</RetroBadge>
				<RetroBadge variant="tan">Beta Access</RetroBadge>
				<RetroBadge variant="pink">New Feature</RetroBadge>
				<RetroBadge variant="white">Default</RetroBadge>
			</div>
		</section>

		<!-- Typography -->
		<section class="space-y-6">
			<h2 class="text-2xl text-[var(--color-charcoal)] font-medium">Typography</h2>
			<div class="space-y-4">
				<div>
					<h1 class="text-6xl text-[var(--color-charcoal)] font-medium">Heading 1 - Display</h1>
					<p class="text-sm text-[var(--color-text-secondary)] mt-2">
						Used for hero sections and primary headlines
					</p>
				</div>
				<div>
					<h2 class="text-4xl text-[var(--color-charcoal)] font-medium">Heading 2 - Section</h2>
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
			</div>
		</section>

		<!-- Shadows & Effects -->
		<section class="space-y-6">
			<h2 class="text-2xl text-[var(--color-charcoal)] font-medium">Shadows & Effects</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="retro-shadow-sm rounded-2xl p-6 bg-white">
					<div class="text-lg font-medium text-[var(--color-charcoal)] mb-2">Small Shadow</div>
					<div class="text-sm text-[var(--color-text-secondary)]">
						4px offset, 2px border - for subtle elevation
					</div>
				</div>
				<div class="retro-shadow rounded-2xl p-6 bg-white">
					<div class="text-lg font-medium text-[var(--color-charcoal)] mb-2">Standard Shadow</div>
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
		</section>
	</div>
</div>

