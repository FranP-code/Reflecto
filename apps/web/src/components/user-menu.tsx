import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/radix-dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function UserMenu() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!session) {
    return (
      <Button asChild variant="outline">
        <Link to="/login">Sign In</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline">{session.name ?? session.email}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card" sideOffset={16}>
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => {
            navigate({ to: "/settings" });
          }}
        >
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await authClient.signOut();
            // Immediately reflect logout in UI
            queryClient.setQueryData(["session", "me"], null);
            await queryClient.invalidateQueries({
              queryKey: ["session", "me"],
            });
            navigate({ to: "/" });
          }}
          variant="destructive"
        >
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
