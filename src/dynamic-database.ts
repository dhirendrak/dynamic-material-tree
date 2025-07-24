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

  addChild(parentNode: string, newChildName: string): void {
    if (!this.dataMap.has(parentNode)) {
      this.dataMap.set(parentNode, []);
    }
    this.dataMap.get(parentNode)!.push(newChildName);
  }

  moveNode(nodeToMove: string, newParentNode: string, oldParentNode: string, index?: number): void {
    // Handle root level operations
    if (oldParentNode === '__ROOT__') {
      // Remove from root level
      const rootIndex = this.rootLevelNodes.indexOf(nodeToMove);
      if (rootIndex > -1) {
        this.rootLevelNodes.splice(rootIndex, 1);
      }
    } else {
      // Remove from old parent
      const oldParentChildren = this.dataMap.get(oldParentNode);
      if (oldParentChildren) {
        const oldIndex = oldParentChildren.indexOf(nodeToMove);
        if (oldIndex > -1) {
          oldParentChildren.splice(oldIndex, 1);
        }
      }
    }
    
    // Add to new parent at specific index
    if (newParentNode === '__ROOT__') {
      // Add to root level
      if (index !== undefined && index >= 0 && index <= this.rootLevelNodes.length) {
        this.rootLevelNodes.splice(index, 0, nodeToMove);
      } else {
        this.rootLevelNodes.push(nodeToMove);
      }
    } else {
      // Add to regular parent
      if (!this.dataMap.has(newParentNode)) {
        this.dataMap.set(newParentNode, []);
      }
      const newParentChildren = this.dataMap.get(newParentNode)!;
      
      if (index !== undefined && index >= 0 && index <= newParentChildren.length) {
        newParentChildren.splice(index, 0, nodeToMove);
      } else {
        newParentChildren.push(nodeToMove);
      }
    }
  }

  removeNode(nodeToRemove: string): void {
    // Remove from parent's children list
    for (const [parent, children] of this.dataMap.entries()) {
      const index = children.indexOf(nodeToRemove);
      if (index > -1) {
        children.splice(index, 1);
        break;
      }
    }
    
    // Remove node's own entry if it exists
    this.dataMap.delete(nodeToRemove);
  }
}
