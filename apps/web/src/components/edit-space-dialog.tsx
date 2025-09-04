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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type EditSpaceDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  color: ColorValue;
  isSaving: boolean;
  onChangeTitle: (v: string) => void;
  onChangeColor: (v: ColorValue) => void;
  onSave: () => void;
};

export function EditSpaceDialog({
  open,
  onOpenChange,
  title,
  color,
  isSaving,
  onChangeTitle,
  onChangeColor,
  onSave,
}: EditSpaceDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 201 }}
      >
        <DialogHeader>
          <DialogTitle>Edit Space</DialogTitle>
          <DialogDescription>
            Update the title and color of your space.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <label
              className="font-medium text-foreground text-sm"
              htmlFor="edit-space-title"
            >
              Title
            </label>
            <Input
              id="edit-space-title"
              onChange={(e) => onChangeTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && title.trim()) {
                  onSave();
                }
              }}
              placeholder="Enter space title..."
              value={title}
            />
          </div>

          <div className="flex flex-col space-y-1">
            <span className="font-medium text-foreground text-sm">Color</span>
            <ColorPicker
              name="edit-space-color"
              onChange={onChangeColor}
              value={color}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose>
            <Button disabled={isSaving} variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button disabled={!title.trim() || isSaving} onClick={onSave}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
