import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { DeleteSpaceDialog } from "@/components/delete-space-dialog";
import { EditSpaceDialog } from "@/components/edit-space-dialog";
import { Button } from "@/components/ui/button";
import type { ColorValue } from "@/components/ui/color-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteSpace, updateSpace } from "@/lib/appwrite-db";

export type SpaceActionsProps = {
  space: { id: string; name: string; color: string };
  userId?: string;
  onUpdated?: () => void;
  onDeleted?: () => void;
};

export function SpaceActions({
  space,
  userId,
  onUpdated,
  onDeleted,
}: SpaceActionsProps) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [title, setTitle] = useState(space.name);
  const [color, setColor] = useState<ColorValue>(normalizeColor(space.color));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setTitle(space.name);
    setColor(normalizeColor(space.color));
  }, [space.name, space.color]);

  const handleSave = async () => {
    if (!userId) {
      return;
    }
    if (!title.trim()) {
      return;
    }
    setIsSaving(true);
    try {
      await updateSpace({
        spaceId: space.id,
        title: title.trim(),
        color: color as string,
        userId,
      });
      setOpenEdit(false);
      onUpdated?.();
    } catch {
      // TODO: add toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) {
      return;
    }
    setIsDeleting(true);
    try {
      await deleteSpace({ spaceId: space.id, userId });
      setOpenDelete(false);
      onDeleted?.();
    } catch {
      // TODO: add toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          // Prevent bubbling to card
          e.stopPropagation();
        }}
      >
        <Button
          aria-label="Open space actions"
          className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
          size="sm"
          variant="ghost"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6}>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenEdit(true);
          }}
        >
          <Pencil className="h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpenDelete(true);
          }}
          variant="destructive"
        >
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>

      <EditSpaceDialog
        color={color}
        isSaving={isSaving}
        onChangeColor={setColor}
        onChangeTitle={setTitle}
        onOpenChange={setOpenEdit}
        onSave={handleSave}
        open={openEdit}
        title={title}
      />

      <DeleteSpaceDialog
        isDeleting={isDeleting}
        onConfirm={handleDelete}
        onOpenChange={setOpenDelete}
        open={openDelete}
        spaceName={space.name}
      />
    </DropdownMenu>
  );
}

// Color helpers constrained to the allowed palette from ColorPicker
const allowedColors = new Set<ColorValue>([
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#ef4444",
  "#10b981",
]);

function normalizeColor(value?: string): ColorValue {
  if (value && (allowedColors as Set<string>).has(value)) {
    return value as ColorValue;
  }
  return "#3b82f6";
}
