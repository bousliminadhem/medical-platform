"use client";

import { useParams } from "next/navigation";
import ClinicalRecord from "@/components/ClinicalRecord";
import { useAuth } from "@/context/AuthContext";

export default function PractitionerPatientPage() {
  const { isPractitioner, loading } = useAuth();
  const { patientId } = useParams<{ patientId: string }>();
  if (loading) return <div className="p-10 text-center text-sm text-zinc-500">Checking authorization…</div>;
  if (!isPractitioner) return <div className="card p-10 text-center text-sm text-red-600">Practitioner access is required.</div>;
  return <ClinicalRecord patientId={patientId} patientName="Patient clinical record" canEdit canViewConsultations />;
}
