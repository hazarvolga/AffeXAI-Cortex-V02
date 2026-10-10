/**
 * CMS Props Mapper
 * 
 * Migration'dan gelen props'ları prebuild component'lerin beklediği formata çevirir
 */

export interface ComponentPropsMapping {
  [key: string]: (props: any) => any;
}

/**
 * Props mapping rules for each block type
 */
export const propsMapper: ComponentPropsMapping = {
  // Gallery Single Image: src -> imageUrl
  'gallery-single-image': (props: any) => ({
    imageUrl: props.src || props.imageUrl || '/placeholder-image.jpg',
    title: props.title || props.alt || 'Image',
    caption: props.caption || '',
    ...props,
  }),

  // Content Simple Block: HTML içeriği parse et
  'content-simple-block': (props: any) => {
    let content = props.content || '';
    
    // HTML etiketlerini temizle (basit strip)
    if (content.includes('<')) {
      content = content
        .replace(/<[^>]*>/g, '') // HTML etiketlerini kaldır
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
    }
    
    return {
      title: props.title || '',
      content: content,
      ...props,
    };
  },

  // Element Button Group: button props mapping
  'element-button-group': (props: any) => {
    // Eğer buttons array varsa kullan
    if (props.buttons && Array.isArray(props.buttons)) {
      return props;
    }

    // Yoksa tek button'dan array oluştur
    const buttons = [];
    
    if (props.text || props.buttonText) {
      buttons.push({
        text: props.text || props.buttonText || 'Button',
        url: props.url || props.buttonUrl || '#',
        variant: props.variant || 'default',
        target: props.target || '_self',
      });
    }

    return {
      buttons,
      ...props,
    };
  },

  // Video Embed Section
  'video-embed-section': (props: any) => ({
    videoUrl: props.videoUrl || props.src || props.url || '',
    title: props.title || 'Video',
    description: props.description || props.caption || '',
    ...props,
  }),
};

/**
 * Map props for a component based on its blockId
 */
export function mapComponentProps(blockId: string, props: any): any {
  const mapper = propsMapper[blockId];
  
  if (mapper) {
    return mapper(props);
  }
  
  // No mapping needed, return original props
  return props;
}

/**
 * Batch map props for multiple components
 */
export function mapComponentsProps(components: any[]): any[] {
  return components.map(component => {
    if (component.type === 'block' && component.blockId) {
      return {
        ...component,
        props: mapComponentProps(component.blockId, component.props || {}),
      };
    }
    return component;
  });
}
