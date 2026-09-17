import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

async function InstrumentsData() {
  const supabase = await createClient();
  const { data: instruments, error } = await supabase
    // @ts-expect-error instruments 테이블이 실제 DB에 없어 database.types.ts에도 없음 (기존 버그, 별도 수정 필요)
    .from("instruments")
    .select();

  if (error) {
    return <p>Error loading instruments: {error.message}</p>;
  }

  return <pre>{JSON.stringify(instruments, null, 2)}</pre>;
}

export default function Instruments() {
  return (
    <Suspense fallback={<div>Loading instruments...</div>}>
      <InstrumentsData />
    </Suspense>
  );
}
