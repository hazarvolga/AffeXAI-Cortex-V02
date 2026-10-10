/**
 * Section Editor
 * Layer 2 of 3-Layer CMS Architecture
 * 
 * Provides:
 * - Visual section template picker
 * - Simple customization sheet
 * - Section reordering
 */

export { SectionPicker } from './SectionPicker';
export { SectionCustomizer } from './SectionCustomizer';
export {
    allSectionTemplates,
    getTemplateById,
    getTemplatesByCategory,
    templateCategories,
    type SectionTemplate
} from './SectionTemplates';
