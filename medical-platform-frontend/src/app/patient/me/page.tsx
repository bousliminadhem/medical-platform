"use client";

import { useEffect, useState } from "react";
import ClinicalRecord from "@/components/ClinicalRecord";
import { useAuth } from "@/context/AuthContext";
import { getMyPatient } from "@/services/patient.service";
import type { PatientResponse } from "@/types/api";

export default function PatientMePage() {
  const { isPatient, loading: authLoading } = useAuth();
  const [patient, setPatient] = useState<PatientResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!authLoading && isPatient) getMyPatient().then(setPatient).catch(() => setError("Unable to load your patient profile.")); }, [authLoading, isPatient]);
  if (authLoading) return <div className="p-10 text-center text-sm text-zinc-500">Checking authorization…</div>;
  if (!isPatient) return <div className="card p-10 text-center text-sm text-red-600">Patient access is required.</div>;
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!patient) return <div className="p-10 text-center text-sm text-zinc-500">Loading profile…</div>;
  return <ClinicalRecord patientId={patient.id} patientName={`${patient.firstName} ${patient.lastName}`} canEdit />;
}
