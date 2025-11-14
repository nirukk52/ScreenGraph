<script lang="ts">
import { Download, Star, Users } from "lucide-svelte";
import type { PageData } from "./$types";

/** App info display page component.
 * PURPOSE: Render Play Store metadata with Skeleton UI styling for visual verification.
 */
const { data }: { data: PageData } = $props();

const appInfo = data.appInfo;
const error = data.error;

/** Track failed image loads for error handling */
let failedImages = $state<Set<string>>(new Set());

/** Handle image load errors */
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement;
  if (img.src) {
    failedImages.add(img.src);
    console.warn("Failed to load screenshot:", img.src);
  }
}

/** Handle successful image loads */
function handleImageLoad(event: Event) {
  const img = event.target as HTMLImageElement;
  if (failedImages.has(img.src)) {
    failedImages.delete(img.src);
  }
}
</script>

{#if error}
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="card variant-filled-error p-6">
      <h2 class="h3 mb-2">Error Loading App Info</h2>
      <p class="text-surface-200">{error}</p>
      <p class="text-surface-300 mt-2 text-sm">Package: {data.packageName}</p>
    </div>
  </div>
{:else if appInfo}
  <div class="container mx-auto p-8 max-w-4xl">
    <!-- App Header Card -->
    <div class="card p-6 mb-6">
      <div class="flex items-start gap-4">
        {#if appInfo.iconUrl}
          <img 
            src={appInfo.iconUrl} 
            alt={appInfo.displayName} 
            class="w-24 h-24 rounded-2xl shadow-lg flex-shrink-0"
          />
        {:else}
          <div class="w-24 h-24 rounded-2xl bg-surface-600 flex items-center justify-center flex-shrink-0">
            <Download class="w-12 h-12 text-surface-400" />
          </div>
        {/if}
        
        <div class="flex-1 min-w-0">
          <h1 class="h2 mb-1">{appInfo.displayName}</h1>
          <p class="text-surface-600 dark:text-surface-400 mb-3">{appInfo.developerName}</p>
          
          <div class="flex flex-wrap gap-4">
            {#if appInfo.ratingScore}
              <div class="flex items-center gap-1">
                <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span class="font-medium">{typeof appInfo.ratingScore === 'number' ? appInfo.ratingScore.toFixed(1) : Number(appInfo.ratingScore).toFixed(1)}</span>
                {#if appInfo.ratingsCount}
                  <span class="text-surface-600 dark:text-surface-400 text-sm">
                    ({appInfo.ratingsCount.toLocaleString()})
                  </span>
                {/if}
              </div>
            {/if}
            
            {#if appInfo.installsLabel}
              <div class="flex items-center gap-1">
                <Users class="w-4 h-4" />
                <span>{appInfo.installsLabel}</span>
              </div>
            {/if}
            
            <div class="chip variant-soft">{appInfo.primaryCategory}</div>
          </div>
        </div>
      </div>
      
      {#if appInfo.shortDescription}
        <p class="mt-4 text-surface-700 dark:text-surface-300">
          {appInfo.shortDescription}
        </p>
      {/if}
    </div>
    
    <!-- App Details Card -->
    <div class="card p-6 mb-6">
      <h2 class="h3 mb-4">Details</h2>
      <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <dt class="text-sm text-surface-600 dark:text-surface-400">Package Name</dt>
          <dd class="font-mono text-sm">{appInfo.packageName}</dd>
        </div>
        
        {#if appInfo.latestVersion}
          <div>
            <dt class="text-sm text-surface-600 dark:text-surface-400">Latest Version</dt>
            <dd class="font-mono text-sm">{appInfo.latestVersion}</dd>
          </div>
        {/if}
        
        {#if appInfo.androidVersionText}
          <div>
            <dt class="text-sm text-surface-600 dark:text-surface-400">Android Version</dt>
            <dd class="text-sm">{appInfo.androidVersionText}</dd>
          </div>
        {/if}
        
        {#if appInfo.lastStoreUpdate}
          <div>
            <dt class="text-sm text-surface-600 dark:text-surface-400">Last Updated</dt>
            <dd class="text-sm">
              {new Date(appInfo.lastStoreUpdate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </dd>
          </div>
        {/if}
        
        <div>
          <dt class="text-sm text-surface-600 dark:text-surface-400">Content Rating</dt>
          <dd class="text-sm">{appInfo.contentRating || 'Not specified'}</dd>
        </div>
        
        <div>
          <dt class="text-sm text-surface-600 dark:text-surface-400">Pricing</dt>
          <dd class="text-sm">
            {appInfo.isFree ? 'Free' : 'Paid'}
            {#if appInfo.offersInAppPurchases}
              <span class="chip variant-soft-warning ml-2 text-xs">In-app purchases</span>
            {/if}
          </dd>
        </div>
        
        {#if appInfo.supportsAds !== null}
          <div>
            <dt class="text-sm text-surface-600 dark:text-surface-400">Ads</dt>
            <dd class="text-sm">{appInfo.supportsAds ? 'Contains ads' : 'No ads'}</dd>
          </div>
        {/if}
        
        {#if appInfo.developerEmail}
          <div>
            <dt class="text-sm text-surface-600 dark:text-surface-400">Developer Email</dt>
            <dd class="text-sm truncate">
              <a href="mailto:{appInfo.developerEmail}" class="anchor">{appInfo.developerEmail}</a>
            </dd>
          </div>
        {/if}
      </dl>
      
      <div class="mt-4">
        <a 
          href={appInfo.playStoreUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          class="btn variant-filled-primary"
        >
          View on Play Store
        </a>
      </div>
    </div>
    
    <!-- Screenshots Gallery -->
    {#if appInfo.media && appInfo.media.length > 0}
      {@const phoneScreenshots = appInfo.media.filter(m => m.kind === 'phone_screenshot')}
      {#if phoneScreenshots.length > 0}
        <div class="card p-6">
          <h2 class="h3 mb-4">Screenshots</h2>
          <div class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {#each phoneScreenshots as screenshot}
              {#if !failedImages.has(screenshot.assetUrl)}
              <img 
                src={screenshot.assetUrl} 
                alt="Screenshot {screenshot.position + 1}"
                  class="h-96 w-auto max-w-sm rounded-lg shadow-lg flex-shrink-0 snap-start object-contain bg-surface-200 dark:bg-surface-800"
                  loading="lazy"
                  crossorigin="anonymous"
                  referrerpolicy="no-referrer"
                  onerror={handleImageError}
                  onload={handleImageLoad}
                />
              {:else}
                <div class="h-96 w-64 rounded-lg shadow-lg flex-shrink-0 snap-start bg-surface-200 dark:bg-surface-800 flex items-center justify-center">
                  <Download class="w-12 h-12 text-surface-400" />
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/if}
    {/if}
  </div>
{:else}
  <div class="container mx-auto p-8 max-w-4xl">
    <div class="card variant-ghost p-6">
      <div class="placeholder animate-pulse">
        <div class="placeholder-circle w-24 h-24 mb-4"></div>
        <div class="placeholder w-full mb-2"></div>
        <div class="placeholder w-3/4 mb-2"></div>
        <div class="placeholder w-1/2"></div>
      </div>
    </div>
  </div>
{/if}

