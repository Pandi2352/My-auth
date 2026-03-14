import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';
import { Button } from './Button';
import { Timer } from 'lucide-react';

interface IdleTimeoutWarningProps {
  open: boolean;
  countdown: number;
  onStayActive: () => void;
  onLogout: () => void;
}

export function IdleTimeoutWarning({
  open,
  countdown,
  onStayActive,
  onLogout,
}: IdleTimeoutWarningProps) {
  return (
    <Modal open={open} onClose={onStayActive}>
      <ModalHeader onClose={onStayActive}>Session Expiring</ModalHeader>
      <ModalBody>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <Timer className="h-8 w-8 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              You've been inactive for a while. For your security, you'll be
              logged out automatically.
            </p>
            <p className="mt-3 text-3xl font-bold tabular-nums text-foreground">
              {countdown}s
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onLogout}>
          Log out now
        </Button>
        <Button onClick={onStayActive}>Stay signed in</Button>
      </ModalFooter>
    </Modal>
  );
}
