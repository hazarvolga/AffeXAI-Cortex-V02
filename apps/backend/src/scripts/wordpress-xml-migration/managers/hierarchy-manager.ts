/**
 * WordPress CMS Migration - Hierarchy Manager
 * 
 * Manages component hierarchy and parent-child relationships.
 * Builds hierarchy tree from parsed HTML elements.
 */

import { ParsedElement } from '../types/migration.types';
import { log } from '../utils/logger';

export interface ComponentNode {
  id: string;
  element: ParsedElement;
  parentId: string | null;
  order: number;
  children: ComponentNode[];
}

export interface FlatComponent {
  element: ParsedElement;
  parentId: string | null;
  order: number;
}

export class HierarchyManager {
  private nodeCounter = 0;

  /**
   * Build component hierarchy from parsed elements
   */
  buildHierarchy(elements: ParsedElement[]): ComponentNode[] {
    this.nodeCounter = 0;
    
    // Build tree structure
    const rootNodes: ComponentNode[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const node = this.createNode(element, null, i);
      
      // Check if element has children
      if (element.children && element.children.length > 0) {
        node.children = this.buildChildNodes(element.children, node.id);
      }
      
      rootNodes.push(node);
    }

    log.info(`Built hierarchy with ${rootNodes.length} root nodes`);
    return rootNodes;
  }

  /**
   * Build child nodes recursively
   */
  private buildChildNodes(elements: ParsedElement[], parentId: string): ComponentNode[] {
    const childNodes: ComponentNode[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const node = this.createNode(element, parentId, i);
      
      if (element.children && element.children.length > 0) {
        node.children = this.buildChildNodes(element.children, node.id);
      }
      
      childNodes.push(node);
    }
    
    return childNodes;
  }

  /**
   * Create a component node
   */
  private createNode(element: ParsedElement, parentId: string | null, order: number): ComponentNode {
    const id = `node-${this.nodeCounter++}`;
    
    return {
      id,
      element,
      parentId,
      order,
      children: [],
    };
  }

  /**
   * Flatten hierarchy tree for database storage
   */
  flattenHierarchy(nodes: ComponentNode[]): FlatComponent[] {
    const flatComponents: FlatComponent[] = [];
    
    for (const node of nodes) {
      this.flattenNode(node, flatComponents);
    }
    
    log.info(`Flattened hierarchy to ${flatComponents.length} components`);
    return flatComponents;
  }

  /**
   * Flatten a single node and its children recursively
   */
  private flattenNode(node: ComponentNode, result: FlatComponent[]): void {
    // Add current node
    // NOTE: Setting parentId to null for now since we're using flat structure
    // Database expects UUID but we're generating "node-X" strings
    result.push({
      element: node.element,
      parentId: null, // Flat structure - no parent relationships
      order: node.order,
    });
    
    // Add children recursively
    for (const child of node.children) {
      this.flattenNode(child, result);
    }
  }

  /**
   * Detect if HTML structure should have hierarchy
   * Returns true if container elements (section, div with children) are present
   */
  detectHierarchy(elements: ParsedElement[]): boolean {
    for (const element of elements) {
      // Check if element is a container
      if (this.isContainerElement(element)) {
        return true;
      }
      
      // Check children recursively
      if (element.children && element.children.length > 0) {
        if (this.detectHierarchy(element.children)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Check if element is a container (section, div, article, etc.)
   */
  private isContainerElement(element: ParsedElement): boolean {
    const containerTags = ['section', 'div', 'article', 'aside', 'header', 'footer', 'main', 'nav'];
    return containerTags.includes(element.tagName.toLowerCase());
  }

  /**
   * Create flat structure (all components at root level)
   */
  createFlatStructure(elements: ParsedElement[]): FlatComponent[] {
    const flatComponents: FlatComponent[] = [];
    
    for (let i = 0; i < elements.length; i++) {
      flatComponents.push({
        element: elements[i],
        parentId: null, // All at root level
        order: i,
      });
    }
    
    log.info(`Created flat structure with ${flatComponents.length} components`);
    return flatComponents;
  }

  /**
   * Validate hierarchy structure
   */
  validateHierarchy(components: FlatComponent[]): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check order values are sequential within each parent
    const parentGroups = new Map<string | null, FlatComponent[]>();
    
    for (const component of components) {
      const key = component.parentId || 'root';
      if (!parentGroups.has(key)) {
        parentGroups.set(key, []);
      }
      parentGroups.get(key)!.push(component);
    }
    
    // Validate each group
    for (const [parentId, group] of parentGroups) {
      const orders = group.map(c => c.order).sort((a, b) => a - b);
      
      // Check if orders start from 0
      if (orders[0] !== 0) {
        errors.push(`Order values for parent ${parentId} do not start from 0`);
      }
      
      // Check if orders are sequential
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i) {
          errors.push(`Order values for parent ${parentId} are not sequential`);
          break;
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get hierarchy statistics
   */
  getHierarchyStats(components: FlatComponent[]): {
    total: number;
    rootLevel: number;
    nested: number;
    maxDepth: number;
  } {
    const rootLevel = components.filter(c => c.parentId === null).length;
    const nested = components.filter(c => c.parentId !== null).length;
    
    // Calculate max depth (simplified - would need full tree for accurate depth)
    const maxDepth = nested > 0 ? 2 : 1;
    
    return {
      total: components.length,
      rootLevel,
      nested,
      maxDepth,
    };
  }
}
