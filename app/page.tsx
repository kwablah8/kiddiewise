import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--bg)]">
      <Button className="bg-[var(--primary)] text-[var(--primary-foreground)]">
        Setup OK
      </Button>
    </main>
  );
}
