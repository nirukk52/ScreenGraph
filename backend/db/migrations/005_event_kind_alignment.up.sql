-- Migration 005: Align run_events.kind with domain EventKind and enforce values
-- Renames column `type` -> `kind` and adds a CHECK constraint listing allowed kinds

-- 1) Rename column if it exists as `type`
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'run_events' AND column_name = 'type'
  ) THEN
    EXECUTE 'ALTER TABLE run_events RENAME COLUMN type TO kind';
  END IF;
END$$;

-- 2) Drop old constraint if re-running and add the new CHECK constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'run_events' AND constraint_name = 'run_events_kind_valid'
  ) THEN
    EXECUTE 'ALTER TABLE run_events DROP CONSTRAINT run_events_kind_valid';
  END IF;
END$$;

ALTER TABLE run_events
  ADD CONSTRAINT run_events_kind_valid CHECK (
    kind IN (
      'agent.run.started',
      'agent.run.finished',
      'agent.run.failed',
      'agent.run.canceled',
      'agent.run.continuation_decided',
      'agent.node.started',
      'agent.node.token_delta',
      'agent.node.finished',
      'agent.event.screenshot_captured',
      'agent.event.ui_hierarchy_captured',
      'agent.event.screen_perceived',
      'agent.event.actions_enumerated',
      'agent.event.action_selected',
      'agent.event.action_performed',
      'agent.event.action_verification_completed',
      'graph.screen.discovered',
      'graph.action.created',
      'graph.updated',
      'agent.run.progress_evaluated',
      'agent.policy.switched',
      'agent.app.restarted',
      'agent.run.recovery_applied',
      'agent.run.checkpoint_restored'
    )
  );


