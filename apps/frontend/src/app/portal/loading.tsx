/** Shown while a portal route's server work or code split is loading. */
export default function PortalLoading() {
  return (
    <div
      role="status"
      className="flex min-h-[40vh] items-center justify-center"
    >
      <div
        aria-hidden="true"
        className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--cortex-line-strong)] border-t-[var(--cortex-accent)]"
      />
      <span className="sr-only">Sayfa yükleniyor</span>
    </div>
  );
}
