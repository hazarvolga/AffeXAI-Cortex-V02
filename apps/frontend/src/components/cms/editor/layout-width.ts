interface PersistedWidthOptions {
  fullWidth?: boolean;
  isFullWidth?: boolean;
}

export function readFullWidth(layout?: PersistedWidthOptions): boolean {
  return layout?.fullWidth ?? layout?.isFullWidth ?? false;
}
