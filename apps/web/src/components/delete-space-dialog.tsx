import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteSpace } from "@/lib/appwrite-db";

export type DeleteSpaceDialogProps = {
  spaceId: string;
  spaceTitle?: string;
  onDeleted?: () => void;
  trigger?: React.ReactNode;
};

export function DeleteSpaceDialog({
  spaceId,
  spaceTitle,
  onDeleted,
  trigger,
}: DeleteSpaceDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSpace({ spaceId });
      onDeleted?.();
    } catch {
      // TODO: toast error
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog>
      {trigger ? <DialogTrigger>{trigger}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-md" style={{ zIndex: 201 }}>
        <DialogHeader>
          <DialogTitle>Delete Space</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            {spaceTitle ? `"${spaceTitle}"` : "this space"}? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose>
            <Button disabled={isDeleting} variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose>
            <Button
              disabled={isDeleting}
              onClick={handleDelete}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
