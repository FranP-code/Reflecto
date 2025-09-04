import { useEffect, useState } from "react";
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
import { updateSpace } from "@/lib/appwrite-db";

export type EditSpaceDialogProps = {
  spaceId: string;
  initialTitle: string;
  initialColor: string;
  onUpdated?: () => void;
  trigger?: React.ReactNode;
};

export function EditSpaceDialog({
  spaceId,
  initialTitle,
  initialColor,
  onUpdated,
  trigger,
}: EditSpaceDialogProps) {
  const [title, setTitle] = useState(initialTitle);
  const [color, setColor] = useState<ColorValue>(
    (initialColor as ColorValue) || "#3b82f6"
  );
  const [isSaving, setIsSaving] = useState(false);

  // Reset local state whenever initial props change (e.g., different space)
  useEffect(() => {
    setTitle(initialTitle);
    setColor((initialColor as ColorValue) || "#3b82f6");
  }, [initialTitle, initialColor]);

  const handleSave = async () => {
    const nextTitle = title.trim();
    if (!nextTitle) {
      return;
    }
    setIsSaving(true);
    try {
      await updateSpace({ spaceId, title: nextTitle, color });
      onUpdated?.();
    } catch {
      // TODO: toast error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md" style={{ zIndex: 201 }}>
        <DialogHeader>
          <DialogTitle>Edit Space</DialogTitle>
          <DialogDescription>
            Update this space's name and color.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                  handleSave();
                }
              }}
              placeholder="Enter space title..."
              value={title}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <span className="font-medium text-foreground text-sm">Color</span>
            <ColorPicker name="space-color" onChange={setColor} value={color} />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose>
            <Button disabled={isSaving} variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <DialogClose>
            <Button disabled={!title.trim() || isSaving} onClick={handleSave}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
