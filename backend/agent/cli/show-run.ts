import { InMemoryRepo } from "../persistence/in-memory-repo";
import { DomainEvent } from "../domain/events";

export async function showRun(repo: InMemoryRepo, runId: string): Promise<void> {
  const run = await repo.getRun(runId);
  if (!run) {
    console.log(`❌ Run ${runId} not found`);
    return;
  }

  console.log(`\n📊 Run Timeline: ${runId}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`Status: ${run.status}`);
  console.log(`Created: ${run.createdAt}`);
  console.log(`Updated: ${run.updatedAt}\n`);

  const events = await repo.getEvents(runId);
  console.log(`Total Events: ${events.length}\n`);

  console.log(`Event Timeline:`);
  console.log(`─────────────────────────────────────────────\n`);

  events.forEach((evt: DomainEvent, idx: number) => {
    const icon = getEventIcon(evt.kind);
    console.log(`${icon} [${evt.sequence.toString().padStart(3, " ")}] ${evt.kind}`);

    if (evt.kind === "agent.node.started" || evt.kind === "agent.node.finished") {
      const nodeName = (evt.payload as any).nodeName;
      console.log(`    └─ Node: ${nodeName}`);
    }

    if (evt.kind === "agent.run.finished") {
      const stopReason = (evt.payload as any).stopReason;
      console.log(`    └─ Reason: ${stopReason}`);
    }

    console.log();
  });

  const snapshots = [];
  for (let i = 0; i <= 10; i++) {
    const snap = await repo.getSnapshot(runId, i);
    if (snap) snapshots.push({ step: i, snap });
  }

  console.log(`\nSnapshots: ${snapshots.length} saved`);
  console.log(`─────────────────────────────────────────────\n`);

  snapshots.forEach(({ step, snap }) => {
    console.log(`📸 Step ${step}: ${snap.nodeName} (iter ${snap.iterationOrdinalNumber})`);
  });

  console.log();
}

function getEventIcon(kind: string): string {
  if (kind.startsWith("agent.run.started")) return "🎬";
  if (kind.startsWith("agent.run.finished")) return "🏁";
  if (kind.startsWith("agent.node.started")) return "▶️";
  if (kind.startsWith("agent.node.finished")) return "✅";
  if (kind.startsWith("graph.")) return "🕸️";
  if (kind.startsWith("agent.event.")) return "📌";
  return "•";
}

if (require.main === module) {
  const runId = process.argv[2];
  if (!runId) {
    console.log("Usage: ts-node show-run.ts <runId>");
    process.exit(1);
  }

  const repo = new InMemoryRepo();
  showRun(repo, runId).catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
}

export default showRun;
