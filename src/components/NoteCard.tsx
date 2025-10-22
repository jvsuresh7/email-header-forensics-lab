import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Download } from "lucide-react";
import { format } from "date-fns";

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    body?: string;
    note_date: string;
    file_url?: string;
    file_name?: string;
    tags?: string[];
    expires_at: string;
  };
}

export const NoteCard = ({ note }: NoteCardProps) => {
  const daysUntilExpiry = Math.ceil(
    (new Date(note.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className="group hover:shadow-md transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
          <Badge variant="outline" className="shrink-0">
            {daysUntilExpiry}d left
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {format(new Date(note.note_date), "MMM d, yyyy")}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {note.body && (
          <p className="text-sm text-muted-foreground line-clamp-3">{note.body}</p>
        )}
        
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {note.file_url && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <a href={note.file_url} target="_blank" rel="noopener noreferrer">
              <FileText className="w-4 h-4 mr-2" />
              {note.file_name || "View Attachment"}
              <Download className="w-4 h-4 ml-auto" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};