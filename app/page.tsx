import Recorder from "./recorder";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 p-6">
      <h1 className="text-3xl font-semibold">Audio recorder</h1>
      <Recorder />
    </main>
  );
}
