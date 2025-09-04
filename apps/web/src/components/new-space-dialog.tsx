import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ColorPicker, type ColorValue } from "@/components/ui/color-picker";
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
import { Input } from "@/components/ui/input";
import { createSpace } from "@/lib/appwrite-db";
import { authClient } from "@/lib/auth-client";

type NewSpaceDialogProps = {
  onSpaceCreated?: () => void;
  triggerButton?: React.ReactNode;
};

export function NewSpaceDialog({
  onSpaceCreated,
  triggerButton,
}: NewSpaceDialogProps) {
  const [_open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState<ColorValue>("#3b82f6");
  const [isCreating, setIsCreating] = useState(false);
  const { data: session } = authClient.useSession();

  const handleCreate = async () => {
    if (!(session?.$id && title.trim())) {
      return;
    }

    setIsCreating(true);
    try {
      await createSpace({
        title: title.trim(),
        color,
        userId: session.$id,
      });

      // Reset form
      setTitle("");
      setColor("#3b82f6");
      setOpen(false);

      // Notify parent to refresh
      onSpaceCreated?.();
    } catch {
      // TODO: Add proper error handling/toast notification
    } finally {
      setIsCreating(false);
    }
  };

  const defaultTrigger = (
    <Button className="gap-2">
      <Plus className="h-4 w-4" />
      New Space
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger>{triggerButton || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Space</DialogTitle>
          <DialogDescription>
            Create a new visual workspace to organize your thoughts and ideas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title Input */}
          <div className="space-y-2">
            <label
              className="font-medium text-foreground text-sm"
              htmlFor="space-title"
            >
              Title
            </label>
            <Input
              id="space-title"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) {
                  handleCreate();
                }
              }}
              placeholder="Enter space title..."
              value={title}
            />
          </div>

          {/* Color Picker */}
          <div className="flex flex-col space-y-1">
            <span className="font-medium text-foreground text-sm">Color</span>
            <ColorPicker name="space-color" onChange={setColor} value={color} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose>
            <Button
              disabled={isCreating}
              onClick={() => setOpen(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </DialogClose>
          <DialogClose>
            <Button
              disabled={!title.trim() || isCreating}
              onClick={handleCreate}
            >
              {isCreating ? "Creating..." : "Create Space"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
