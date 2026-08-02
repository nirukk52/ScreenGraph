<!--
Tenant onboarding landing page
PURPOSE: Connect venkat.ag (first) and ShopLoop (second), with GitHub,
Slack, and Perplexity connectors for venkat.
-->
<script lang="ts">
import type { tenants } from "$lib/encore-client";
import { connectTenantConnector, disconnectTenantConnector, listTenants } from "$lib/tenants";
import autoAnimate from "@formkit/auto-animate";
import { Check, ExternalLink, Github, Link2, MessageSquare, Search } from "lucide-svelte";

/** Ordered tenant roster loaded from the backend */
let tenantRows = $state<tenants.TenantRecord[]>([]);
/** Page-level loading flag for the initial fetch */
let loading = $state(true);
/** Page-level error message when the roster cannot load */
let loadError = $state<string | null>(null);
/** Connector currently being connected or disconnected */
let busyKey = $state<string | null>(null);
/** Transient success banner after a connector mutation */
let actionMessage = $state<string | null>(null);

/**
 * connectorKey builds a stable busy-state key for a tenant connector.
 * PURPOSE: Disable only the button currently running a mutation.
 */
function connectorKey(slug: string, provider: tenants.ConnectorProvider): string {
  return `${slug}:${provider}`;
}

/**
 * providerLabel returns a human-readable connector name.
 * PURPOSE: Keep UI copy free of raw provider enums.
 */
function providerLabel(provider: tenants.ConnectorProvider): string {
  if (provider === "github") return "GitHub";
  if (provider === "slack") return "Slack";
  return "Perplexity";
}

/**
 * providerDescription explains what each connector does for a tenant.
 * PURPOSE: Give operators one-sentence context before connecting.
 */
function providerDescription(provider: tenants.ConnectorProvider): string {
  if (provider === "github") {
    return "PR checks, repo context, and CI-triggered drift runs.";
  }
  if (provider === "slack") {
    return "Push drift alerts and run summaries into your workspace.";
  }
  return "Research grounding and answer enrichment via Perplexity.";
}

/**
 * statusTone maps connector status to a short badge label.
 * PURPOSE: Keep badge text consistent across the landing page.
 */
function statusTone(status: tenants.ConnectorStatus): string {
  if (status === "connected") return "Connected";
  if (status === "error") return "Error";
  if (status === "disconnected") return "Disconnected";
  return "Ready to connect";
}

/**
 * refreshTenants reloads the tenant roster from the API.
 * PURPOSE: Keep the landing page in sync after connect/disconnect.
 */
async function refreshTenants(): Promise<void> {
  const response = await listTenants();
  tenantRows = [...response.tenants];
}

/**
 * handleConnect links a connector for the given tenant.
 * PURPOSE: Complete the venkat GitHub / Slack / Perplexity setup flow.
 */
async function handleConnect(slug: string, provider: tenants.ConnectorProvider): Promise<void> {
  const key = connectorKey(slug, provider);
  busyKey = key;
  actionMessage = null;
  try {
    await connectTenantConnector(slug, provider, `${slug}/${provider}`);
    await refreshTenants();
    actionMessage = `${providerLabel(provider)} connected for ${slug}.`;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to connect connector";
  } finally {
    busyKey = null;
  }
}

/**
 * handleDisconnect unlinks a connector for the given tenant.
 * PURPOSE: Allow operators to reverse a connector link from the landing page.
 */
async function handleDisconnect(slug: string, provider: tenants.ConnectorProvider): Promise<void> {
  const key = connectorKey(slug, provider);
  busyKey = key;
  actionMessage = null;
  try {
    await disconnectTenantConnector(slug, provider);
    await refreshTenants();
    actionMessage = `${providerLabel(provider)} disconnected for ${slug}.`;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to disconnect connector";
  } finally {
    busyKey = null;
  }
}

$effect(() => {
  let canceled = false;
  (async () => {
    loading = true;
    loadError = null;
    try {
      await refreshTenants();
    } catch (error) {
      if (!canceled) {
        loadError = error instanceof Error ? error.message : "Failed to load tenants";
      }
    } finally {
      if (!canceled) {
        loading = false;
      }
    }
  })();
  return () => {
    canceled = true;
  };
});
</script>

<svelte:head>
  <title>Connect Tenants – ScreenGraph</title>
  <meta
    name="description"
    content="Connect venkat.ag and ShopLoop as ScreenGraph tenants. Link GitHub, Slack, and Perplexity for venkat."
  />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="tenant-landing">
  <section class="hero" aria-labelledby="tenant-hero-title">
    <div class="hero-atmosphere" aria-hidden="true"></div>
    <div class="hero-inner">
      <p class="brand">ScreenGraph</p>
      <h1 id="tenant-hero-title">Connect your first tenants.</h1>
      <p class="lede">
        venkat.ag is tenant one. ShopLoop is tenant two. Link GitHub, Slack, and
        Perplexity so drift signals meet the tools your team already uses.
      </p>
      <div class="cta-row">
        <a class="cta-primary" href="#tenants">Open tenant roster</a>
        <a class="cta-secondary" href="https://venkat.ag" target="_blank" rel="noreferrer">
          Visit venkat.ag
          <ExternalLink class="icon" />
        </a>
      </div>
    </div>
  </section>

  <section id="tenants" class="roster" aria-labelledby="roster-title">
    <div class="section-head">
      <h2 id="roster-title">Tenant roster</h2>
      <p>First tenant gets the connector pack. Second tenant is staged and ready.</p>
    </div>

    {#if actionMessage}
      <p class="banner success" role="status">{actionMessage}</p>
    {/if}
    {#if loadError}
      <p class="banner error" role="alert">{loadError}</p>
    {/if}

    {#if loading}
      <p class="muted">Loading tenants…</p>
    {:else}
      <div class="tenant-list" use:autoAnimate>
        {#each tenantRows as tenant, index (tenant.tenantId)}
          <article class="tenant-block" data-status={tenant.status}>
            <header class="tenant-head">
              <div>
                <p class="eyebrow">Tenant {String(index + 1).padStart(2, "0")}</p>
                <h3>{tenant.displayName}</h3>
                <p class="tenant-desc">{tenant.description}</p>
              </div>
              <div class="tenant-meta">
                <span class="status-pill" data-status={tenant.status}>{tenant.status}</span>
                <a class="site-link" href={tenant.websiteUrl} target="_blank" rel="noreferrer">
                  {tenant.websiteUrl.replace(/^https?:\/\//, "")}
                  <ExternalLink class="icon" />
                </a>
              </div>
            </header>

            {#if tenant.connectors.length > 0}
              <div class="connector-grid" use:autoAnimate>
                {#each tenant.connectors as connector (connector.connectorId)}
                  <div class="connector-row" data-status={connector.status}>
                    <div class="connector-copy">
                      <div class="connector-title">
                        {#if connector.provider === "github"}
                          <Github class="provider-icon" />
                        {:else if connector.provider === "slack"}
                          <MessageSquare class="provider-icon" />
                        {:else}
                          <Search class="provider-icon" />
                        {/if}
                        <strong>{providerLabel(connector.provider)}</strong>
                        <span class="status-pill subtle" data-status={connector.status}>
                          {statusTone(connector.status)}
                        </span>
                      </div>
                      <p>{providerDescription(connector.provider)}</p>
                      {#if connector.externalAccountLabel}
                        <p class="account-label">
                          <Link2 class="icon" />
                          {connector.externalAccountLabel}
                        </p>
                      {/if}
                    </div>
                    <div class="connector-actions">
                      {#if connector.status === "connected"}
                        <button
                          type="button"
                          class="btn-secondary"
                          disabled={busyKey === connectorKey(tenant.slug, connector.provider)}
                          onclick={() => handleDisconnect(tenant.slug, connector.provider)}
                        >
                          Disconnect
                        </button>
                        <span class="connected-mark" aria-hidden="true">
                          <Check class="icon" />
                        </span>
                      {:else}
                        <button
                          type="button"
                          class="btn-primary"
                          disabled={busyKey === connectorKey(tenant.slug, connector.provider)}
                          onclick={() => handleConnect(tenant.slug, connector.provider)}
                        >
                          {busyKey === connectorKey(tenant.slug, connector.provider)
                            ? "Connecting…"
                            : `Connect ${providerLabel(connector.provider)}`}
                        </button>
                      {/if}
                    </div>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="muted staged">No connectors staged yet. Connectors land with tenant activation.</p>
            {/if}
          </article>
        {/each}
      </div>
    {/if}
  </section>
</div>

<style>
  .tenant-landing {
    --ink: #14201c;
    --paper: #f3efe4;
    --moss: #1f6b4f;
    --moss-deep: #0f3d2e;
    --sand: #e4d7c0;
    --signal: #c45c26;
    --line: rgba(20, 32, 28, 0.14);
    --font-display: "Space Grotesk", "Avenir Next", sans-serif;
    --font-body: "IBM Plex Sans", "Helvetica Neue", sans-serif;
    min-height: calc(100vh - 3.5rem);
    background:
      radial-gradient(circle at 12% 18%, rgba(31, 107, 79, 0.18), transparent 42%),
      radial-gradient(circle at 88% 8%, rgba(196, 92, 38, 0.16), transparent 36%),
      linear-gradient(180deg, #efe7d6 0%, var(--paper) 48%, #e8e1d2 100%);
    color: var(--ink);
    font-family: var(--font-body);
  }

  .hero {
    position: relative;
    overflow: hidden;
    border-bottom: 1px solid var(--line);
    padding: clamp(3rem, 8vw, 6rem) clamp(1.25rem, 4vw, 3rem);
  }

  .hero-atmosphere {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(120deg, rgba(20, 32, 28, 0.04) 1px, transparent 1px),
      linear-gradient(210deg, rgba(20, 32, 28, 0.03) 1px, transparent 1px);
    background-size: 28px 28px, 42px 42px;
    mask-image: linear-gradient(180deg, black 30%, transparent 95%);
    animation: drift 18s linear infinite;
  }

  .hero-inner {
    position: relative;
    max-width: 48rem;
    display: grid;
    gap: 1rem;
  }

  .brand {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2.4rem, 6vw, 4.2rem);
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 0.95;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.6rem, 3.4vw, 2.4rem);
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  .lede {
    margin: 0;
    max-width: 38rem;
    font-size: 1.05rem;
    line-height: 1.55;
    color: rgba(20, 32, 28, 0.78);
  }

  .cta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .cta-primary,
  .cta-secondary,
  .btn-primary,
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border-radius: 0.35rem;
    padding: 0.7rem 1rem;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid var(--ink);
    transition:
      transform 160ms ease,
      background-color 160ms ease,
      color 160ms ease;
  }

  .cta-primary,
  .btn-primary {
    background: var(--moss);
    color: #f7f3ea;
    border-color: var(--moss-deep);
  }

  .cta-secondary,
  .btn-secondary {
    background: transparent;
    color: var(--ink);
  }

  .cta-primary:hover,
  .btn-primary:hover,
  .cta-secondary:hover,
  .btn-secondary:hover {
    transform: translateY(-1px);
  }

  .btn-primary:disabled,
  .btn-secondary:disabled {
    opacity: 0.55;
    transform: none;
    cursor: not-allowed;
  }

  .roster {
    padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3rem) 4rem;
    max-width: 72rem;
  }

  .section-head {
    display: grid;
    gap: 0.35rem;
    margin-bottom: 1.5rem;
  }

  .section-head h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.7rem;
  }

  .section-head p,
  .muted,
  .tenant-desc,
  .account-label,
  .connector-copy p {
    margin: 0;
    color: rgba(20, 32, 28, 0.72);
  }

  .banner {
    margin: 0 0 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--line);
    border-radius: 0.4rem;
  }

  .banner.success {
    background: rgba(31, 107, 79, 0.12);
  }

  .banner.error {
    background: rgba(196, 92, 38, 0.14);
  }

  .tenant-list {
    display: grid;
    gap: 1.25rem;
  }

  .tenant-block {
    border: 1px solid var(--line);
    background: rgba(255, 252, 245, 0.72);
    padding: 1.25rem;
    animation: rise 420ms ease both;
  }

  .tenant-block:nth-child(2) {
    animation-delay: 80ms;
  }

  .tenant-head {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .eyebrow {
    margin: 0 0 0.25rem;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--signal);
    font-weight: 600;
  }

  .tenant-head h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.55rem;
  }

  .tenant-meta {
    display: grid;
    gap: 0.5rem;
    justify-items: end;
  }

  .status-pill {
    display: inline-flex;
    align-items: center;
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--line);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--sand);
  }

  .status-pill[data-status="active"],
  .status-pill[data-status="connected"] {
    background: rgba(31, 107, 79, 0.16);
  }

  .status-pill.subtle {
    text-transform: none;
    letter-spacing: 0;
  }

  .site-link {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--moss-deep);
    font-weight: 500;
  }

  .connector-grid {
    display: grid;
    gap: 0.75rem;
  }

  .connector-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 0;
    border-top: 1px solid var(--line);
  }

  .connector-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    margin-bottom: 0.35rem;
  }

  .connector-title :global(svg),
  .site-link :global(svg),
  .cta-secondary :global(svg),
  .account-label :global(svg),
  .connected-mark :global(svg) {
    width: 1rem;
    height: 1rem;
  }

  .connector-actions {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .connected-mark {
    display: inline-flex;
    color: var(--moss);
  }

  .account-label {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.35rem;
    font-size: 0.9rem;
  }

  .staged {
    border-top: 1px solid var(--line);
    padding-top: 0.9rem;
  }

  @keyframes drift {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(18px);
    }
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 720px) {
    .tenant-meta {
      justify-items: start;
    }

    .connector-actions {
      width: 100%;
    }

    .btn-primary,
    .btn-secondary {
      width: 100%;
      justify-content: center;
    }
  }
</style>
