import { Suspense } from "react";
import { BoardScreen } from "@/components/board/BoardScreen";

function BoardFallback() {
  return (
    <main className="mx-auto w-full max-w-[1200px] px-5 pt-7">
      <p className="text-muted" role="status">
        Cargando tablero…
      </p>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<BoardFallback />}>
      <BoardScreen />
    </Suspense>
  );
}
