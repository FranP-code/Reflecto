import { MoreHorizontal, Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Space = {
  id: string;
  name: string;
  lastEdited: string;
  preview: string;
  itemCount: number;
  color: string;
};

// Mock data for demonstration
const mockSpaces: Space[] = [
  {
    id: "1",
    name: "Product Strategy",
    lastEdited: "2 hours ago",
    preview: "/whiteboard-with-product-strategy-diagrams-and-stic.jpg",
    itemCount: 12,
    color: "bg-blue-500",
  },
  {
    id: "2",
    name: "Research Notes",
    lastEdited: "1 day ago",
    preview: "/whiteboard-with-research-mind-map-and-connections.jpg",
    itemCount: 8,
    color: "bg-green-500",
  },
  {
    id: "3",
    name: "Meeting Ideas",
    lastEdited: "3 days ago",
    preview: "/whiteboard-with-meeting-notes-and-action-items.jpg",
    itemCount: 15,
    color: "bg-purple-500",
  },
  {
    id: "4",
    name: "Design System",
    lastEdited: "1 week ago",
    preview: "/whiteboard-with-ui-components-and-design-patterns.jpg",
    itemCount: 24,
    color: "bg-orange-500",
  },
  {
    id: "5",
    name: "Learning Path",
    lastEdited: "2 weeks ago",
    preview: "/whiteboard-with-learning-roadmap-and-progress-trac.jpg",
    itemCount: 6,
    color: "bg-pink-500",
  },
  {
    id: "6",
    name: "Project Planning",
    lastEdited: "3 weeks ago",
    preview: "/whiteboard-with-project-timeline-and-milestones.jpg",
    itemCount: 18,
    color: "bg-cyan-500",
  },
];

export function SpacesGrid() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl text-foreground">Your Spaces</h1>
          <p className="mt-1 text-muted-foreground">
            Organize your thoughts and ideas in visual workspaces
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Space
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
          <Input className="pl-10" placeholder="Search spaces..." />
        </div>
        <Badge className="px-3 py-1" variant="secondary">
          {mockSpaces.length} spaces
        </Badge>
      </div>

      {/* Spaces Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockSpaces.map((space) => (
          <Card
            className="group cursor-pointer border-border/50 transition-all duration-200 hover:border-border hover:shadow-lg"
            key={space.id}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${space.color}`} />
                  <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    {space.name}
                  </h3>
                </div>
                <Button
                  className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                  size="sm"
                  variant="ghost"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pb-3">
              {/* Whiteboard Preview */}
              <div className="relative overflow-hidden rounded-lg border border-border/30 bg-muted/30">
                <img
                  alt={`${space.name} preview`}
                  className="h-32 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                  src={space.preview || "/placeholder.svg"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between pt-0 text-muted-foreground text-sm">
              <span>{space.itemCount} items</span>
              <span>Edited {space.lastEdited}</span>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State (when no spaces exist) */}
      {mockSpaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 font-semibold text-foreground text-lg">
            No spaces yet
          </h3>
          <p className="mb-4 max-w-sm text-muted-foreground">
            Create your first space to start organizing your thoughts and ideas
            visually.
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Space
          </Button>
        </div>
      )}
    </div>
  );
}
