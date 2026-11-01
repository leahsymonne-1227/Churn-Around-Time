import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { SecurityOutlined } from '@mui/icons-material';

function Modal({ id, title, onClose, children, actions }) {
  return (
    <Dialog open onClose={onClose} aria-labelledby={`${id}-title`}>
      <DialogTitle id={`${id}-title`} component="h2">{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>{actions}</DialogActions>
    </Dialog>
  );
}

/** Renders whichever dialog is open. `dialog` is a name or ''. */
export function Dialogs({ dialog, onClose, onConfirmAi }) {
  const close = <Button onClick={onClose}>Close</Button>;
  switch (dialog) {
    case 'about':
      return (
        <Modal id="about" title="How the risk score is calculated" onClose={onClose} actions={<Button variant="contained" onClick={onClose}>Got it</Button>}>
          <div className="prose">
            <p>For uploaded files, the local preview starts each customer at 24 points. It adds 13 points for each detected negative word or phrase and subtracts 7 for each detected positive word or phrase, then keeps the result between 12 and 96. Phrases such as “no cancellation language” are not counted as warnings.</p>
            <p><b>Calls</b> add the supplied call counts, or count rows marked as calls when no count is provided. <b>Signals</b> count detected negative terms. Rows are combined by email, or by customer name when no email is present.</p>
            <p><b>Risk bands:</b> High 70–96, Medium 40–69, Low 12–39. The sample preview uses illustrative scores. Uploaded-file scores are a simple prioritization heuristic, not a validated prediction; review the original notes before acting.</p>
            <p>If you opt into AI review, it provides an additional summary after you confirm what customer details will be sent.</p>
          </div>
        </Modal>
      );
    case 'purchase':
      return (
        <Modal id="purchase" title="Purchase the full version" onClose={onClose} actions={close}>
          <p className="prose">The full version is being prepared. Secure checkout, plan details, and account setup will be connected here once pricing is finalized.</p>
        </Modal>
      );
    case 'login':
      return (
        <Modal id="login" title="Log in" onClose={onClose} actions={close}>
          <p className="prose">Accounts are coming soon. For now this preview needs no sign-in, and nothing you upload is saved.</p>
        </Modal>
      );
    case 'setup':
      return (
        <Modal id="setup" title="Set up AI analysis" onClose={onClose} actions={close}>
          <div className="prose">
            <p>AI analysis needs an OpenAI API key configured on the server. This preview works without AI using sample data and local text signals.</p>
            <ol className="setup-steps">
              <li>Add <code>OPENAI_API_KEY</code> to <code>.env.local</code>.</li>
              <li>Keep the key on the server. Never give it a <code>VITE_</code> prefix.</li>
              <li>Restart the app. No Supabase project is needed.</li>
            </ol>
            <Alert severity="warning" icon={<SecurityOutlined />}>Because the free preview has no login, a public launch needs strong abuse and cost limits on the AI endpoint.</Alert>
          </div>
        </Modal>
      );
    case 'ai-confirm':
      return (
        <Modal id="ai" title="Send customer data for AI review?" onClose={onClose} actions={<><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={onConfirmAi}>Send for review</Button></>}>
          <div className="prose">
            <p>This sends the following extracted fields from up to 100 customer records to OpenAI through your configured server: customer and company names, notes, detected signals, call counts, and mention counts. Original uploaded files are not sent by this AI request.</p>
            <Alert severity="info">OpenAI API inputs and outputs are not used for model training by default. Standard abuse-monitoring logs may retain content for up to 30 days.</Alert>
            <p className="muted">No AI request is sent unless you choose “Send for review.”</p>
          </div>
        </Modal>
      );
    default:
      return null;
  }
}
