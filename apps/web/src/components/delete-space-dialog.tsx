import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type DeleteSpaceDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isDeleting: boolean;
  onConfirm: () => void;
  spaceName: string;
};

export function DeleteSpaceDialog({
  open,
  onOpenChange,
  isDeleting,
  onConfirm,
  spaceName,
}: DeleteSpaceDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 201 }}
      >
        <DialogHeader>
          <DialogTitle>Delete Space</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the space
            "{spaceName}" for your account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose>
            <Button disabled={isDeleting} variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            disabled={isDeleting}
            onClick={onConfirm}
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
