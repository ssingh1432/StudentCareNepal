import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmationDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isOpen: boolean;
  isDestructive?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  isOpen: isOpenProp,
  isDestructive = false,
  isPending = false,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  const [isOpen, setIsOpen] = useState(isOpenProp);

  // Sync with prop
  useEffect(() => {
    setIsOpen(isOpenProp);
  }, [isOpenProp]);

  // Handle dialog close
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onCancel();
    }, 300); // Wait for dialog animation
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-500">{message}</p>
        </div>
        
        <DialogFooter className="flex flex-row justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}