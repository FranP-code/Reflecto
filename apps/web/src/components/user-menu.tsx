import { Link, useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/use-auth";
import { authService } from "@/lib/auth-service";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function UserMenu() {
  const navigate = useNavigate();
  const { user, isPending } = useAuth();

  if (isPending) {
    return <Skeleton className="h-9 w-24" />;
  }

  if (!user) {
    return (
      <Button asChild variant="outline">
        <Link to="/login">Sign In</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{user.name}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>{user.email}</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            className="w-full"
            onClick={async () => {
              try {
                await authService.signOut();
                navigate({
                  to: "/",
                });
              } catch (error) {
                console.error("Sign out failed:", error);
              }
            }}
            variant="destructive"
          >
            Sign Out
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
