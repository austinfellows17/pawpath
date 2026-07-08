export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold text-trail-950">
        404
      </h1>
      <p className="mt-3 text-sand-700">
        This page doesn&apos;t exist — but local walkers near you might.
      </p>
      <a
        href="/find"
        className="mt-6 inline-block text-trail-700 hover:underline"
      >
        Find walkers →
      </a>
    </div>
  );
}
