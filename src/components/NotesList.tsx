import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NoteCard } from "./NoteCard";
import { Skeleton } from "@/components/ui/skeleton";

interface NotesListProps {
  teacherId?: string;
  searchQuery?: string;
}

export const NotesList = ({ teacherId, searchQuery }: NotesListProps) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      
      let query = supabase
        .from("notes")
        .select("*")
        .order("note_date", { ascending: false });

      if (teacherId) {
        query = query.eq("teacher_id", teacherId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching notes:", error);
      } else {
        let filteredData = data || [];
        
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          filteredData = filteredData.filter(note =>
            note.title.toLowerCase().includes(lowerQuery) ||
            note.body?.toLowerCase().includes(lowerQuery) ||
            note.tags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))
          );
        }
        
        setNotes(filteredData);
      }
      
      setLoading(false);
    };

    fetchNotes();

    const channel = supabase
      .channel("notes-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
        },
        () => {
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, searchQuery]);

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No notes found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} />
      ))}
    </div>
  );
};