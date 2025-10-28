-- Migration 006: Add missing app-related event kinds to run_events constraint
-- Adds agent.app.install_checked, agent.app.signature_verified, agent.app.launch_started, 
-- agent.app.launch_completed, agent.app.launch_failed, and agent.run.heartbeat

-- Drop existing constraint
ALTER TABLE run_events DROP CONSTRAINT IF EXISTS run_events_kind_valid;

-- Add updated constraint with all event kinds
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
      'agent.run.checkpoint_restored',
      'agent.run.heartbeat',
      'agent.app.install_checked',
      'agent.app.signature_verified',
      'agent.app.launch_started',
      'agent.app.launch_completed',
      'agent.app.launch_failed'
    )
  );
