import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Loader2 } from "lucide-react";

interface UploadNoteFormProps {
  teacherId: string;
}

export const UploadNoteForm = ({ teacherId }: UploadNoteFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const body = formData.get("body") as string;
    const noteDate = formData.get("noteDate") as string;
    const tags = (formData.get("tags") as string)
      .split(",")
      .map(tag => tag.trim())
      .filter(Boolean);

    try {
      let fileUrl = null;
      let fileName = null;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${teacherId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("notes")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("notes")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const { error: insertError } = await supabase
        .from("notes")
        .insert([{
          teacher_id: teacherId,
          title,
          body,
          note_date: noteDate,
          file_url: fileUrl,
          file_name: fileName,
          tags,
          expires_at: expiresAt.toISOString(),
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Note uploaded!",
        description: "Your note has been saved successfully.",
      });

      (e.target as HTMLFormElement).reset();
      setFile(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Note Title *</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Algebra - Quadratic Equations"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noteDate">Date *</Label>
              <Input
                id="noteDate"
                name="noteDate"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Note Content</Label>
            <Textarea
              id="body"
              name="body"
              placeholder="Add any additional notes or context..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="e.g., math, algebra, homework"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload File (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file && (
                <span className="text-sm text-muted-foreground">{file.name}</span>
              )}
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Note
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};