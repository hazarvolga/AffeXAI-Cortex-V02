import { toPropertySchema } from './property-schema-adapter';

describe('CMS property schema adapter', () => {
  it('indexes fields by property name and preserves select labels/defaults', () => {
    expect(toPropertySchema([
      { key: 'alignment', label: 'Alignment', type: 'select', defaultValue: 'left', options: [{ value: 'left', label: 'Left aligned' }] },
    ])).toEqual({ alignment: {
      label: 'Alignment', type: 'select', defaultValue: 'left',
      options: ['left'], optionLabels: { left: 'Left aligned' },
    } });
  });

  it('converts nested array object fields without mutating their schema', () => {
    const fields = [{ key: 'title', label: 'Title', type: 'text' as const, defaultValue: 'New title' }];
    const result = toPropertySchema([{ key: 'items', label: 'Items', type: 'array', itemSchema: { key: 'item', label: 'Item', type: 'object', fields } }]);
    expect(result.items.itemSchema?.title.defaultValue).toBe('New title');
    expect(fields[0].key).toBe('title');
  });
});
