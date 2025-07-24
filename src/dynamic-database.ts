import { Injectable } from "@angular/core";
import { DynamicFlatNode } from "./tree-dynamic-example";
import { treeData } from "./tree-data";

/**
 * Database for dynamic data. When expanding a node in the tree, the data source will need to fetch
 * the descendants data from the database.
 */
@Injectable({ providedIn: "root" })
export class DynamicDatabase {
  dataMap = treeData;

  rootLevelNodes: string[] = ["Fruits", "Vegetables"];

  /** Initial data from database */
  initialData(): DynamicFlatNode[] {
    return this.rootLevelNodes.map(
      (name) => new DynamicFlatNode(name, 0, true)
    );
  }

  getChildren(node: string): string[] | undefined {
    return this.dataMap.get(node);
  }

  isExpandable(node: string): boolean {
    return this.dataMap.has(node);
  }

  /**
   * Move a node from one parent to another
   * @param nodeToMove - The node to move
   * @param fromParent - Current parent of the node
   * @param toParent - New parent for the node
   * @param toIndex - Optional index position in the new parent (defaults to end)
   * @returns boolean indicating success
   */
  moveNode(
    nodeToMove: string,
    fromParent: string,
    toParent: string,
    toIndex?: number
  ): boolean {
    const fromChildren = this.dataMap.get(fromParent);
    const toChildren = this.dataMap.get(toParent);

    if (!fromChildren || !toChildren) {
      return false;
    }

    const nodeIndex = fromChildren.indexOf(nodeToMove);
    if (nodeIndex === -1) {
      return false;
    }

    // Remove from current parent
    fromChildren.splice(nodeIndex, 1);

    // Add to new parent at specified index or end
    if (toIndex !== undefined && toIndex >= 0 && toIndex <= toChildren.length) {
      toChildren.splice(toIndex, 0, nodeToMove);
    } else {
      toChildren.push(nodeToMove);
    }

    return true;
  }

  /**
   * Move a node within the same parent to a different position
   * @param nodeToMove - The node to move
   * @param parent - Parent containing the node
   * @param newIndex - New index position within the parent
   * @returns boolean indicating success
   */
  moveNodeWithinParent(
    nodeToMove: string,
    parent: string,
    newIndex: number
  ): boolean {
    const children = this.dataMap.get(parent);

    if (!children) {
      return false;
    }

    const currentIndex = children.indexOf(nodeToMove);
    if (currentIndex === -1 || newIndex < 0 || newIndex >= children.length) {
      return false;
    }

    // Remove from current position
    const [movedNode] = children.splice(currentIndex, 1);

    // Insert at new position
    children.splice(newIndex, 0, movedNode);

    return true;
  }

  /**
   * Find the parent of a given node
   * @param nodeToFind - The node to find the parent for
   * @returns The parent node name or null if not found
   */
  findParent(nodeToFind: string): string | null {
    // Check root level nodes
    if (this.rootLevelNodes.includes(nodeToFind)) {
      return null; // Root nodes have no parent
    }

    // Search through all nodes to find the parent
    for (const [parent, children] of this.dataMap.entries()) {
      if (children.includes(nodeToFind)) {
        return parent;
      }
    }

    return null;
  }

  /**
   * Get all possible parent nodes (nodes that can have children)
   * @returns Array of node names that can be parents
   */
  getPossibleParents(): string[] {
    return Array.from(this.dataMap.keys());
  }

  /**
   * Check if a move operation would create a circular dependency
   * @param nodeToMove - The node to move
   * @param newParent - The proposed new parent
   * @returns boolean indicating if the move would create a cycle
   */
  wouldCreateCycle(nodeToMove: string, newParent: string): boolean {
    // If the new parent is the same as the node being moved, it's a cycle
    if (nodeToMove === newParent) {
      return true;
    }

    // Check if the new parent is a descendant of the node being moved
    const descendants = this.getAllDescendants(nodeToMove);
    return descendants.includes(newParent);
  }

  /**
   * Get all descendants of a node recursively
   * @param node - The node to get descendants for
   * @returns Array of all descendant node names
   */
  private getAllDescendants(node: string): string[] {
    const descendants: string[] = [];
    const children = this.dataMap.get(node);

    if (children) {
      for (const child of children) {
        descendants.push(child);
        descendants.push(...this.getAllDescendants(child));
      }
    }

    return descendants;
  }
}
