"use client";
import { useState } from "react";
import { MachineScanner } from "@/components/workout/machine-scanner";
const catalog = [
  { id: "a", name: "Prensa de piernas", aliases: [], primaryMuscles: ["quadriceps", "glutes"], tracksWeight: true, tracksDuration: false, tracksDistance: false },
  { id: "b", name: "Sentadilla hack", aliases: [], primaryMuscles: ["quadriceps"], tracksWeight: true, tracksDuration: false, tracksDistance: false },
];
export default function Page() {
  const [log, setLog] = useState("abierto");
  const [n, setN] = useState(0);
  return (
    <>
      <p id="log">{log}</p>
      <button id="reopen" onClick={() => setN(n + 1)}>r</button>
      <MachineScanner key={n} catalog={catalog} onPick={(e) => setLog(`pick:${e.name}`)} onManual={(q) => setLog(`manual:${q}`)} onClose={() => setLog("cerrado")} />
    </>
  );
}
