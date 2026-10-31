import React, { useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

/**
 * One ConfirmDialog driven by a request object, so a page can ask "are you sure?" before any
 * action without a separate dialog and open-state per action:
 *
 *   const [request, setRequest] = useState(null);
 *   setRequest({ title, description, confirmLabel, destructive, action });
 *   <PendingConfirmDialog request={request} onClose={() => setRequest(null)} />
 *
 * `action` may be async; the confirm button shows a spinner and the dialog stays put until it
 * settles. Errors are the action's own to report — this only closes the dialog.
 */
const PendingConfirmDialog = ({ request, onClose }) => {
  const [running, setRunning] = useState(false);

  const confirm = async () => {
    setRunning(true);
    try {
      await request.action();
    } finally {
      setRunning(false);
      onClose();
    }
  };

  return (
    <ConfirmDialog
      open={!!request}
      title={request?.title}
      description={request?.description}
      confirmLabel={request?.confirmLabel || 'Confirm'}
      destructive={request?.destructive ?? false}
      loading={running}
      onConfirm={confirm}
      onCancel={onClose}
    />
  );
};

export default PendingConfirmDialog;
