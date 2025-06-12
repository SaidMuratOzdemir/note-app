import { Note, ParentNote, SubNote } from '../types/Note';

// Configuration constants for hierarchy management
export const HIERARCHY_CONFIG = {
  MAX_DEPTH: 5,           // Maximum allowed depth
  WARNING_DEPTH: 3,       // Show warnings at this depth
  MAX_CHILDREN_PER_NODE: 50, // Performance limit per node
  ENABLE_CIRCULAR_DETECTION: true,
  ENABLE_PERFORMANCE_WARNINGS: true,
} as const;

// Result interfaces for validation
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
  warnings?: string[];
}

export interface CanCreateResult extends ValidationResult {
  wouldExceedDepth: boolean;
  wouldExceedChildren: boolean;
  currentDepth: number;
  maxDepthAllowed: number;
  childrenCount: number;
}

export interface HierarchyStats {
  depth: number;
  descendantCount: number;
  hasCircularRef: boolean;
  performance: 'good' | 'warning' | 'critical';
  maxBranchDepth: number;
  totalSize: number;
  childrenCount: number;
}

export interface CircularReference {
  path: string[];
  affectedNotes: string[];
  severity: 'warning' | 'error';
}

/**
 * Enhanced utility functions for multi-level sub-notes management
 * Supports unlimited depth with configurable safety limits
 */
export class SubNoteUtils {
  /**
   * Check if a note is a sub-note (has parentId)
   */
  static isSubNote(note: Note): note is SubNote {
    return !!note.parentId;
  }

  /**
   * Check if a note is a parent note (no parentId)
   */
  static isParentNote(note: Note): note is ParentNote {
    return !note.parentId;
  }

  /**
   * Get sub-note count for a specific parent from an array
   */
  static getSubNoteCountFromArray(parentId: string, notes: Note[]): number {
    return notes.filter(note => note.parentId === parentId).length;
  }

  /**
   * Get sub-notes for a specific parent from an array
   */
  static getSubNotesFromArray(parentId: string, notes: Note[]): Note[] {
    return notes
      .filter(note => note.parentId === parentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Get only parent notes from an array (for HomeScreen)
   */
  static getParentNotesFromArray(notes: Note[]): Note[] {
    return notes.filter(note => !note.parentId);
  }

  /**
   * Get the hierarchy path from a note to its root parent
   */
  static getNotePath(note: Note, allNotes: Note[]): Note[] {
    const path: Note[] = [];
    const maxDepth = 10; // Prevent stack overflow
    let currentDepth = 0;
    
    // Recursively build path from note to root
    const buildPath = (currentNote: Note) => {
      if (currentDepth >= maxDepth) {
        console.warn(`[SubNoteUtils] Max depth reached for note: ${currentNote.id}`);
        return;
      }
      
      path.unshift(currentNote);
      currentDepth++;
      
      if (currentNote.parentId) {
        const parent = allNotes.find(n => n.id === currentNote.parentId);
        if (parent) {
          buildPath(parent);
        }
      }
      currentDepth--;
    };
    
    buildPath(note);
    return path;
  }

  /**
   * Get full hierarchy level (depth) of a note
   */
  static getNoteDepth(note: Note, allNotes: Note[]): number {
    let depth = 0;
    let currentNote = note;
    
    while (currentNote.parentId) {
      depth++;
      const parent = allNotes.find(n => n.id === currentNote.parentId);
      if (!parent) break;
      currentNote = parent;
    }
    
    return depth;
  }

  /**
   * Get all descendant notes (children, grandchildren, etc.)
   * Protected against infinite recursion with cycle detection
   */
  static getAllDescendants(parentId: string, allNotes: Note[]): Note[] {
    const descendants: Note[] = [];
    const visited = new Set<string>(); // Cycle detection
    
    const findDescendants = (currentParentId: string) => {
      // Prevent infinite recursion
      if (visited.has(currentParentId)) {
        console.warn(`[SubNoteUtils] Circular reference detected for note: ${currentParentId}`);
        return;
      }
      visited.add(currentParentId);
      
      const children = allNotes.filter(note => note.parentId === currentParentId);
      for (const child of children) {
        descendants.push(child);
        findDescendants(child.id); // Recursively find sub-children
      }
      
      visited.delete(currentParentId); // Clean up for other branches
    };
    
    findDescendants(parentId);
    return descendants;
  }

  /**
   * Validate if a note can be made a sub-note of another
   */
  static canMakeSubNote(noteId: string, parentId: string, allNotes: Note[]): boolean {
    // Can't make a note a sub-note of itself
    if (noteId === parentId) return false;
    
    // Can't make a note a sub-note of its own descendant (would create cycle)
    const descendants = this.getAllDescendants(noteId, allNotes);
    return !descendants.some(desc => desc.id === parentId);
  }

  // ==========================================
  // ENHANCED VALIDATION METHODS (Phase 1)
  // ==========================================

  /**
   * Comprehensive validation for creating a sub-note
   * Checks depth limits, circular references, and performance impact
   */
  static canCreateSubNote(parentId: string, allNotes: Note[]): CanCreateResult {
    console.log('[SubNoteUtils] 🔍 Validating sub-note creation for parent:', parentId);
    
    // Find parent note
    const parentNote = allNotes.find(note => note.id === parentId);
    if (!parentNote) {
      return {
        isValid: false,
        reason: 'Parent note not found',
        wouldExceedDepth: false,
        wouldExceedChildren: false,
        currentDepth: 0,
        maxDepthAllowed: HIERARCHY_CONFIG.MAX_DEPTH,
        childrenCount: 0,
      };
    }

    // Check current depth
    const currentDepth = this.getNoteDepth(parentNote, allNotes);
    const wouldExceedDepth = currentDepth >= HIERARCHY_CONFIG.MAX_DEPTH;

    // Check children count
    const childrenCount = this.getSubNoteCountFromArray(parentId, allNotes);
    const wouldExceedChildren = childrenCount >= HIERARCHY_CONFIG.MAX_CHILDREN_PER_NODE;

    // Generate warnings and suggestions
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (currentDepth >= HIERARCHY_CONFIG.WARNING_DEPTH) {
      warnings.push(`Bu not ${currentDepth + 1}. seviyede olacak (Önerilen: ≤${HIERARCHY_CONFIG.WARNING_DEPTH})`);
      suggestions.push('Derin hiyerarşiler navigasyonu zorlaştırabilir');
    }

    if (childrenCount >= HIERARCHY_CONFIG.MAX_CHILDREN_PER_NODE * 0.8) {
      warnings.push(`Bu not altında ${childrenCount} alt not var (Limit: ${HIERARCHY_CONFIG.MAX_CHILDREN_PER_NODE})`);
      suggestions.push('Alt notları kategorilere ayırmayı düşünün');
    }

    const result: CanCreateResult = {
      isValid: !wouldExceedDepth && !wouldExceedChildren,
      wouldExceedDepth,
      wouldExceedChildren,
      currentDepth,
      maxDepthAllowed: HIERARCHY_CONFIG.MAX_DEPTH,
      childrenCount,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

    if (!result.isValid) {
      if (wouldExceedDepth) {
        result.reason = `Maksimum derinlik aşıldı (${HIERARCHY_CONFIG.MAX_DEPTH} seviye)`;
      } else if (wouldExceedChildren) {
        result.reason = `Maksimum alt not sayısı aşıldı (${HIERARCHY_CONFIG.MAX_CHILDREN_PER_NODE} alt not)`;
      }
    }

    console.log('[SubNoteUtils] ✅ Validation complete:', {
      parentId,
      isValid: result.isValid,
      currentDepth,
      childrenCount,
      warnings: warnings.length,
      suggestions: suggestions.length,
    });

    return result;
  }

  /**
   * Get comprehensive hierarchy statistics for a note
   */
  static getHierarchyStats(noteId: string, allNotes: Note[]): HierarchyStats {
    const note = allNotes.find(n => n.id === noteId);
    if (!note) {
      return {
        depth: 0,
        descendantCount: 0,
        hasCircularRef: false,
        performance: 'good',
        maxBranchDepth: 0,
        totalSize: 0,
        childrenCount: 0,
      };
    }

    const depth = this.getNoteDepth(note, allNotes);
    const descendants = this.getAllDescendants(noteId, allNotes);
    const childrenCount = this.getSubNoteCountFromArray(noteId, allNotes);
    
    // Calculate max branch depth from this node
    let maxBranchDepth = 0;
    const children = this.getSubNotesFromArray(noteId, allNotes);
    for (const child of children) {
      const childBranchDepth = this.getMaxDepthFromNode(child.id, allNotes);
      maxBranchDepth = Math.max(maxBranchDepth, childBranchDepth);
    }

    // Check for circular references in this subtree
    const hasCircularRef = this.hasCircularReference(noteId, allNotes);

    // Determine performance rating
    let performance: 'good' | 'warning' | 'critical' = 'good';
    if (descendants.length > 100 || depth > HIERARCHY_CONFIG.WARNING_DEPTH) {
      performance = 'warning';
    }
    if (descendants.length > 500 || depth > HIERARCHY_CONFIG.MAX_DEPTH) {
      performance = 'critical';
    }

    return {
      depth,
      descendantCount: descendants.length,
      hasCircularRef,
      performance,
      maxBranchDepth,
      totalSize: descendants.length + 1, // Include self
      childrenCount,
    };
  }

  /**
   * Find all circular references in the note hierarchy
   */
  static findCircularReferences(allNotes: Note[]): CircularReference[] {
    const circularRefs: CircularReference[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const detectCycle = (noteId: string, path: string[]): boolean => {
      if (recursionStack.has(noteId)) {
        // Found a cycle!
        const cycleStart = path.indexOf(noteId);
        const cyclePath = path.slice(cycleStart);
        cyclePath.push(noteId); // Complete the cycle

        circularRefs.push({
          path: cyclePath,
          affectedNotes: [...new Set(cyclePath)],
          severity: 'error',
        });
        return true;
      }

      if (visited.has(noteId)) {
        return false; // Already processed this branch
      }

      visited.add(noteId);
      recursionStack.add(noteId);

      const children = this.getSubNotesFromArray(noteId, allNotes);
      for (const child of children) {
        if (detectCycle(child.id, [...path, noteId])) {
          // Cycle detected in subtree
        }
      }

      recursionStack.delete(noteId);
      return false;
    };

    // Check all root notes
    const rootNotes = this.getParentNotesFromArray(allNotes);
    for (const root of rootNotes) {
      detectCycle(root.id, []);
    }

    return circularRefs;
  }

  /**
   * Check if a specific note has circular reference in its hierarchy
   */
  static hasCircularReference(noteId: string, allNotes: Note[]): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkCycle = (currentId: string): boolean => {
      if (recursionStack.has(currentId)) {
        return true; // Cycle detected
      }
      if (visited.has(currentId)) {
        return false; // Already checked
      }

      visited.add(currentId);
      recursionStack.add(currentId);

      const children = this.getSubNotesFromArray(currentId, allNotes);
      for (const child of children) {
        if (checkCycle(child.id)) {
          return true;
        }
      }

      recursionStack.delete(currentId);
      return false;
    };

    return checkCycle(noteId);
  }

  /**
   * Get maximum depth from a specific node downward
   */
  private static getMaxDepthFromNode(nodeId: string, allNotes: Note[]): number {
    let maxDepth = 0;
    const children = this.getSubNotesFromArray(nodeId, allNotes);
    
    for (const child of children) {
      const childDepth = 1 + this.getMaxDepthFromNode(child.id, allNotes);
      maxDepth = Math.max(maxDepth, childDepth);
    }
    
    return maxDepth;
  }

  /**
   * Validate hierarchy health and return diagnostic information
   */
  static validateHierarchyHealth(allNotes: Note[]): {
    isHealthy: boolean;
    issues: string[];
    warnings: string[];
    stats: {
      totalNotes: number;
      rootNotes: number;
      maxDepth: number;
      avgDepth: number;
      circularReferences: number;
    };
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Find circular references
    const circularRefs = this.findCircularReferences(allNotes);
    if (circularRefs.length > 0) {
      issues.push(`${circularRefs.length} circular reference(s) detected`);
    }

    // Check orphaned notes (parentId points to non-existent note)
    const orphanedNotes = allNotes.filter(note => {
      if (!note.parentId) return false;
      return !allNotes.some(parent => parent.id === note.parentId);
    });
    if (orphanedNotes.length > 0) {
      issues.push(`${orphanedNotes.length} orphaned note(s) found`);
    }

    // Calculate statistics
    const rootNotes = this.getParentNotesFromArray(allNotes);
    let maxDepth = 0;
    let totalDepth = 0;

    for (const note of allNotes) {
      const depth = this.getNoteDepth(note, allNotes);
      maxDepth = Math.max(maxDepth, depth);
      totalDepth += depth;

      // Check for performance warnings
      if (depth > HIERARCHY_CONFIG.WARNING_DEPTH) {
        warnings.push(`Note "${note.title || note.id}" is at depth ${depth}`);
      }

      const childrenCount = this.getSubNoteCountFromArray(note.id, allNotes);
      if (childrenCount > HIERARCHY_CONFIG.MAX_CHILDREN_PER_NODE * 0.8) {
        warnings.push(`Note "${note.title || note.id}" has ${childrenCount} children`);
      }
    }

    const avgDepth = allNotes.length > 0 ? totalDepth / allNotes.length : 0;

    return {
      isHealthy: issues.length === 0,
      issues,
      warnings,
      stats: {
        totalNotes: allNotes.length,
        rootNotes: rootNotes.length,
        maxDepth,
        avgDepth: Math.round(avgDepth * 100) / 100,
        circularReferences: circularRefs.length,
      },
    };
  }
}
