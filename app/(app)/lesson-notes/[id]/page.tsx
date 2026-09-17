import { LessonNoteDetail } from "@/components/lesson-notes/lesson-note-detail";

interface LessonNoteDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonNoteDetailPage({ params }: LessonNoteDetailPageProps) {
  const { id } = await params;
  return <LessonNoteDetail id={id} backHref="/lesson-notes" />;
}
