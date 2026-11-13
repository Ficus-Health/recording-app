"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "requesting" | "recording" | "recorded";

export default function Recorder() {
  const [status, setStatus] = useState<Status>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  async function start() {
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    setError(null);
    setStatus("requesting");

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "Microphone access was denied. Allow it and try again."
          : name === "NotFoundError"
            ? "No microphone was found."
            : "Could not access the microphone.",
      );
      setStatus("idle");
      return;
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setError("Audio recording is not supported in this browser.");
      setStatus("idle");
      return;
    }

    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;
      setAudioUrl(url);
      setStatus("recorded");
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
    recorder.onerror = () => {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setError("Something went wrong while recording.");
      setStatus("idle");
    };

    recorderRef.current = recorder;
    streamRef.current = stream;
    recorder.start();
    setStatus("recording");
  }

  function stop() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function reset() {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    chunksRef.current = [];
    recorderRef.current = null;
    setAudioUrl(null);
    setError(null);
    setStatus("idle");
  }

  function handleClick() {
    if (status === "idle") void start();
    else if (status === "recording") stop();
    else if (status === "recorded") reset();
  }

  const label =
    status === "recording"
      ? "Stop"
      : status === "recorded"
        ? "Reset"
        : status === "requesting"
          ? "Waiting for microphone…"
          : "Record";

  const styles =
    status === "recording"
      ? "bg-red-600 text-white animate-pulse hover:bg-red-700"
      : "bg-white text-blue-950 hover:bg-blue-100";

  return (
    <div className="flex flex-col items-center gap-6">
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "requesting"}
        className={`min-w-48 rounded-full px-8 py-4 text-lg font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${styles}`}
      >
        {label}
      </button>

      <div aria-live="polite" className="min-h-6 text-sm">
        {error ? (
          <p role="alert" className="text-red-400">
            {error}
          </p>
        ) : status === "recording" ? (
          <p>Recording…</p>
        ) : null}
      </div>

      {status === "recorded" && audioUrl && (
        <audio controls src={audioUrl} className="w-full max-w-sm scheme-dark" />
      )}
    </div>
  );
}
