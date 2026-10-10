import { readFullWidth } from './layout-width';

describe('CMS persisted layout width compatibility', () => {
  it('preserves legacy full-width pages', () => {
    expect(readFullWidth({ isFullWidth: true })).toBe(true);
  });
  it('respects explicit fullWidth=false over the legacy value', () => {
    expect(readFullWidth({ fullWidth: false, isFullWidth: true })).toBe(false);
  });
  it('uses the current width when supplied and defaults missing layouts to boxed', () => {
    expect(readFullWidth({ fullWidth: true, isFullWidth: false })).toBe(true);
    expect(readFullWidth({})).toBe(false);
    expect(readFullWidth(undefined)).toBe(false);
  });
});
