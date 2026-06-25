export default function TailwindTestPage() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center p-10">
      <div className="bg-white p-8 rounded-3xl shadow-2xl">
        <h1 className="text-5xl font-black text-red-600 animate-bounce">
          TAILWIND IS WORKING!
        </h1>
        <p className="mt-4 text-xl text-gray-600 font-bold">
          If you see a red background and this text is styled, Tailwind is successfully compiling.
        </p>
      </div>
    </div>
  );
}
