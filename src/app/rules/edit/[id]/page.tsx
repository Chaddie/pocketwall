"use client";

import { useParams } from "next/navigation";
import { RuleEditor } from "@/components/RuleEditor";

export default function EditRulePage() {
  const params = useParams<{ id: string }>();
  return <RuleEditor id={decodeURIComponent(params.id)} />;
}
