import { Injectable } from "@angular/core";
import { treeData } from "./tree-data";
import { DynamicFlatNode } from "./dynamic-flat-node";

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
    console.log(
      "🗄️ [DynamicDatabase] initialData() called, returning root nodes:",
      this.rootLevelNodes
    );
    return this.rootLevelNodes.map(
      (name) => new DynamicFlatNode(name, 0, true)
    );
  }

  getChildren(node: string): string[] | undefined {
    const children = this.dataMap.get(node);
    console.log(
      "🗄️ [DynamicDatabase] getChildren() for node:",
      node,
      "→",
      children
    );
    return children;
  }

  getChildrenAsync(node: string): Promise<string[] | undefined> {
    console.log(
      "🗄️ [DynamicDatabase] getChildrenAsync() called for node:",
      node
    );
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        const children = this.dataMap.get(node);
        console.log(
          "🗄️ [DynamicDatabase] getChildrenAsync() resolved for node:",
          node,
          "→",
          children
        );
        resolve(children);
      }, 1000);
    });
  }

  isExpandable(node: string): boolean {
    return this.dataMap.has(node);
  }

  addChild(parentNode: string, newChildName: string): void {
    console.log(
      "🗄️ [DynamicDatabase] addChild() called - parent:",
      parentNode,
      "child:",
      newChildName
    );
    if (!this.dataMap.has(parentNode)) {
      this.dataMap.set(parentNode, []);
    }
    this.dataMap.get(parentNode)!.push(newChildName);
    console.log(
      "🗄️ [DynamicDatabase] addChild() completed - parent children now:",
      this.dataMap.get(parentNode)
    );
  }

  moveNode(
    nodeToMove: string,
    newParentNode: string,
    oldParentNode: string,
    index?: number
  ): void {
    console.log("🗄️ [DynamicDatabase] moveNode() called:", {
      nodeToMove,
      newParentNode,
      oldParentNode,
      index,
    });

    // Handle root level operations
    if (oldParentNode === "__ROOT__") {
      // Remove from root level
      const rootIndex = this.rootLevelNodes.indexOf(nodeToMove);
      console.log(
        "🗄️ [DynamicDatabase] Removing from root level, index:",
        rootIndex
      );
      if (rootIndex > -1) {
        this.rootLevelNodes.splice(rootIndex, 1);
      }
    } else {
      // Remove from old parent
      const oldParentChildren = this.dataMap.get(oldParentNode);
      if (oldParentChildren) {
        const oldIndex = oldParentChildren.indexOf(nodeToMove);
        console.log(
          "🗄️ [DynamicDatabase] Removing from old parent:",
          oldParentNode,
          "at index:",
          oldIndex
        );
        if (oldIndex > -1) {
          oldParentChildren.splice(oldIndex, 1);
        }
      }
    }

    // Add to new parent at specific index
    if (newParentNode === "__ROOT__") {
      // Add to root level
      console.log("🗄️ [DynamicDatabase] Adding to root level at index:", index);
      if (
        index !== undefined &&
        index >= 0 &&
        index <= this.rootLevelNodes.length
      ) {
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
      console.log(
        "🗄️ [DynamicDatabase] Adding to new parent:",
        newParentNode,
        "at index:",
        index
      );

      if (
        index !== undefined &&
        index >= 0 &&
        index <= newParentChildren.length
      ) {
        newParentChildren.splice(index, 0, nodeToMove);
      } else {
        newParentChildren.push(nodeToMove);
      }
    }

    console.log(
      "🗄️ [DynamicDatabase] moveNode() completed. Root nodes:",
      this.rootLevelNodes
    );
    console.log(
      "🗄️ [DynamicDatabase] Data map:",
      Object.fromEntries(this.dataMap)
    );
  }

  removeNode(nodeToRemove: string): void {
    console.log("🗄️ [DynamicDatabase] removeNode() called for:", nodeToRemove);

    // Remove from parent's children list
    for (const [parent, children] of this.dataMap.entries()) {
      const index = children.indexOf(nodeToRemove);
      if (index > -1) {
        console.log(
          "🗄️ [DynamicDatabase] Removing from parent:",
          parent,
          "at index:",
          index
        );
        children.splice(index, 1);
        break;
      }
    }

    // Remove node's own entry if it exists
    if (this.dataMap.has(nodeToRemove)) {
      console.log(
        "🗄️ [DynamicDatabase] Removing node entry from dataMap:",
        nodeToRemove
      );
      this.dataMap.delete(nodeToRemove);
    }

    console.log(
      "🗄️ [DynamicDatabase] removeNode() completed. Data map:",
      Object.fromEntries(this.dataMap)
    );
  }
}
