-- Migration 009: Add Appium and device lifecycle event kinds
-- Adds event kinds for automated Appium lifecycle management (FR-001)
--
-- New event kinds:
-- - agent.device.check_started
-- - agent.device.check_completed
-- - agent.appium.health_check_started
-- - agent.appium.health_check_completed
-- - agent.appium.starting
-- - agent.appium.ready
-- - agent.appium.start_failed
-- - agent.appium.stop_initiated
-- - agent.appium.stop_completed

-- Drop existing constraint
ALTER TABLE run_events DROP CONSTRAINT IF EXISTS run_events_kind_valid;

-- Add updated constraint with lifecycle event kinds
ALTER TABLE run_events
  ADD CONSTRAINT run_events_kind_valid CHECK (
    kind IN (
      -- Run lifecycle
      'agent.run.started',
      'agent.run.finished',
      'agent.run.failed',
      'agent.run.canceled',
      'agent.run.continuation_decided',
      'agent.run.heartbeat',
      'agent.run.progress_evaluated',
      'agent.run.recovery_applied',
      'agent.run.checkpoint_restored',
      
      -- Node lifecycle
      'agent.node.started',
      'agent.node.token_delta',
      'agent.node.finished',
      
      -- Perception events
      'agent.event.screenshot_captured',
      'agent.event.ui_hierarchy_captured',
      'agent.event.screen_perceived',
      
      -- Action events
      'agent.event.actions_enumerated',
      'agent.event.action_selected',
      'agent.event.action_performed',
      'agent.event.action_verification_completed',
      
      -- Policy events
      'agent.policy.switched',
      
      -- App lifecycle
      'agent.app.install_checked',
      'agent.app.signature_verified',
      'agent.app.launch_started',
      'agent.app.launch_completed',
      'agent.app.launch_failed',
      'agent.app.restarted',
      
      -- Device lifecycle (NEW)
      'agent.device.check_started',
      'agent.device.check_completed',
      
      -- Appium lifecycle (NEW)
      'agent.appium.health_check_started',
      'agent.appium.health_check_completed',
      'agent.appium.starting',
      'agent.appium.ready',
      'agent.appium.start_failed',
      'agent.appium.stop_initiated',
      'agent.appium.stop_completed',
      
      -- Graph events
      'graph.screen.discovered',
      'graph.action.created',
      'graph.edge.created',
      'graph.updated'
    )
  );

