<script>
  let count = $state(0);
</script>

<main style="display:flex;min-height:100vh;align-items:center;justify-content:center;font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif">
  <div style="text-align:center">
    <h1 style="font-size:2rem;margin-bottom:1rem">SvelteKit on Vercel</h1>
    <p style="margin-bottom:1rem">Minimal page to verify deploy</p>
    <button onclick={() => count++} style="padding:.5rem 1rem;border-radius:.5rem;border:1px solid #ddd">Clicked {count} times</button>
  </div>
</main>

