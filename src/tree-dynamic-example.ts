import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
} from "@angular/cdk/drag-drop";
import { FlatTreeControl } from "@angular/cdk/tree";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTreeModule } from "@angular/material/tree";
import { DynamicDataSource } from "./dynamic-data-source";
import { DynamicFlatNode } from "./dynamic-flat-node";

/**
 * @title Tree with dynamic data
 */
@Component({
  selector: "tree-dynamic-example",
  standalone: true,
  imports: [
    MatTreeModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-tree
      [dataSource]="dataSource"
      [treeControl]="treeControl"
      cdkDropList
      [cdkDropListData]="dataSource.data"
      (cdkDropListDropped)="drop($event)"
      cdkDropListOrientation="vertical"
    >
      <mat-tree-node
        *matTreeNodeDef="let node"
        matTreeNodePadding
        cdkDrag
        [cdkDragData]="node"
        class="tree-node"
        [class.drag-disabled]="isDragDisabled(node)"
        [cdkDragDisabled]="isDragDisabled(node)"
      >
        <div class="node-content">
          <button mat-icon-button disabled></button>
          <span cdkDragHandle class="drag-handle">
            <mat-icon>drag_indicator</mat-icon>
          </span>
          <span class="node-label">{{ node.item }}</span>
        </div>
        <div *cdkDragPlaceholder class="drag-placeholder">
          {{ node.item }}
        </div>
      </mat-tree-node>

      <mat-tree-node
        *matTreeNodeDef="let node; when: hasChild"
        matTreeNodePadding
        [cdkTreeNodeTypeaheadLabel]="node.item"
        cdkDrag
        [cdkDragData]="node"
        class="tree-node expandable-node"
        [class.drag-disabled]="isDragDisabled(node)"
        [cdkDragDisabled]="isDragDisabled(node)"
      >
        <div class="node-content">
          <button
            mat-icon-button
            [attr.aria-label]="'Toggle ' + node.item"
            matTreeNodeToggle
            class="toggle-button"
          >
            <mat-icon class="mat-icon-rtl-mirror">
              {{
                treeControl.isExpanded(node) ? "expand_more" : "chevron_right"
              }}
            </mat-icon>
          </button>
          <span cdkDragHandle class="drag-handle">
            <mat-icon>drag_indicator</mat-icon>
          </span>
          <span class="node-label">{{ node.item }}</span>
        </div>

        @if (node.isLoading()) {
        <mat-progress-bar
          mode="indeterminate"
          class="example-tree-progress-bar"
        ></mat-progress-bar>
        }

        <div *cdkDragPlaceholder class="drag-placeholder">
          {{ node.item }}
        </div>
      </mat-tree-node>
    </mat-tree>
  `,
  styles: [
    `
      .example-tree-progress-bar {
        margin-left: 30px;
      }

      .tree-node {
        position: relative;
        border: 2px solid transparent;
        border-radius: 4px;
        transition: border-color 0.2s ease;
      }

      .tree-node:hover {
        background-color: rgba(0, 0, 0, 0.04);
      }

      .tree-node.cdk-drag-preview {
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        background: white;
        border: 1px solid #ccc;
        border-radius: 4px;
        padding: 8px;
      }

      .tree-node.cdk-drag-animating {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .tree-node.cdk-drop-list-dragging .tree-node:not(.cdk-drag-placeholder) {
        transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
      }

      .node-content {
        display: flex;
        align-items: center;
        padding: 4px 0;
      }

      .drag-handle {
        cursor: grab;
        color: rgba(0, 0, 0, 0.54);
        margin-right: 8px;
        display: flex;
        align-items: center;
      }

      .drag-handle:active {
        cursor: grabbing;
      }

      .drag-handle mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .node-label {
        flex: 1;
        user-select: none;
      }

      .toggle-button {
        margin-right: 4px;
      }

      .drag-placeholder {
        background: #f0f0f0;
        border: 2px dashed #ccc;
        border-radius: 4px;
        padding: 8px;
        margin: 2px 0;
        opacity: 0.7;
      }

      .drag-disabled {
        opacity: 0.6;
      }

      .drag-disabled .drag-handle {
        cursor: not-allowed;
        color: rgba(0, 0, 0, 0.26);
      }

      .cdk-drop-list-receiving {
        border: 2px solid #2196f3;
        border-radius: 4px;
      }

      .drop-zone-indicator {
        height: 2px;
        background-color: #2196f3;
        margin: 2px 0;
        border-radius: 1px;
      }
    `,
  ],
})
export class TreeDynamicExample {
  constructor() {
    this.treeControl = new FlatTreeControl<DynamicFlatNode>(
      this.getLevel,
      this.isExpandable
    );

    this.dataSource = new DynamicDataSource(this.treeControl);

    this.dataSource.data = ["Fruits", "Vegetables"].map(
      (name) => new DynamicFlatNode(name, 0, true)
    );
  }

  treeControl: FlatTreeControl<DynamicFlatNode>;

  dataSource: DynamicDataSource;

  getLevel = (node: DynamicFlatNode) => node.level;

  isExpandable = (node: DynamicFlatNode) => node.expandable;

  hasChild = (_: number, _nodeData: DynamicFlatNode) => _nodeData.expandable;

  isDragDisabled = (node: DynamicFlatNode) => node.isLoading();

  drop(event: CdkDragDrop<DynamicFlatNode[]>) {
    const draggedNode = event.item.data as DynamicFlatNode;
    const targetIndex = event.currentIndex;

    console.log("🌳 [TreeDynamicExample] drop() called:", {
      draggedNode: draggedNode.item,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });

    if (event.previousIndex === event.currentIndex) {
      console.log("🌳 [TreeDynamicExample] No position change, returning");
      return; // No change in position
    }

    // Find the target position and determine new parent
    const targetNode = this.findTargetNode(targetIndex, draggedNode);
    const oldParent = this.findParentNode(draggedNode);

    console.log("🌳 [TreeDynamicExample] Target analysis:", {
      targetNode: targetNode
        ? { newParent: targetNode.newParent.item, index: targetNode.index }
        : null,
      oldParent: oldParent?.item,
    });

    if (!targetNode) {
      console.log("🌳 [TreeDynamicExample] Invalid drop target, returning");
      return; // Invalid drop target
    }

    // If oldParent is null, it means the dragged node is at root level
    // Since we're restricting root level operations, we need to handle this
    if (!oldParent) {
      console.log(
        "🌳 [TreeDynamicExample] Cannot move root level nodes, returning"
      );
      return;
    }

    // Restrict root level node creation - prevent dropping to root level
    if (targetNode.newParent.item === "__ROOT__") {
      console.log(
        "🌳 [TreeDynamicExample] Root level drops are restricted, returning"
      );
      return;
    }

    // Prevent dropping a node into itself or its descendants
    if (this.isDescendant(targetNode.newParent, draggedNode)) {
      console.log(
        "🌳 [TreeDynamicExample] Cannot drop node into its descendant, returning"
      );
      return;
    }

    console.log("🌳 [TreeDynamicExample] Calling dataSource.moveNode()");
    // Move the node in the data source
    this.dataSource.moveNode(
      draggedNode,
      targetNode.newParent,
      oldParent,
      targetNode.index
    );
  }

  private findTargetNode(
    targetIndex: number,
    draggedNode: DynamicFlatNode
  ): {
    newParent: DynamicFlatNode;
    index: number;
  } | null {
    const data = this.dataSource.data;
    console.log(
      "🌳 [TreeDynamicExample] findTargetNode() called with targetIndex:",
      targetIndex,
      "data length:",
      data.length
    );

    if (targetIndex >= data.length) {
      // Dropped at the end - restrict root level drops
      console.log(
        "🌳 [TreeDynamicExample] Target at end, but root level drops are restricted"
      );
      return null;
    }

    const targetNode = data[targetIndex];
    console.log(
      "🌳 [TreeDynamicExample] Target node:",
      targetNode.item,
      "expanded:",
      this.treeControl.isExpanded(targetNode)
    );

    // If target is expanded and has children, make it the parent
    if (this.treeControl.isExpanded(targetNode) && targetNode.expandable) {
      const result = {
        newParent: targetNode,
        index: 0,
      };
      console.log(
        "🌳 [TreeDynamicExample] Target is expanded, making it parent with index 0"
      );
      return result;
    }

    // Otherwise, find the parent of the target node and insert after target
    const targetParent = this.findParentNode(targetNode);
    console.log(
      "🌳 [TreeDynamicExample] Target parent:",
      targetParent?.item || "ROOT"
    );

    if (!targetParent) {
      // Target is at root level - restrict root level drops
      console.log(
        "🌳 [TreeDynamicExample] Target at root level, but root level drops are restricted"
      );
      return null;
    }

    // Find index within parent's children
    const parentChildren = this.getChildrenOfNode(targetParent);
    const targetIndexInParent = parentChildren.findIndex(
      (n) => n.item === targetNode.item
    );

    const result = {
      newParent: targetParent,
      index: targetIndexInParent + 1,
    };
    console.log(
      "🌳 [TreeDynamicExample] Target index in parent:",
      targetIndexInParent,
      "new index:",
      result.index
    );
    return result;
  }

  private findParentNode(childNode: DynamicFlatNode): DynamicFlatNode | null {
    const childIndex = this.dataSource.data.indexOf(childNode);
    console.log(
      "🌳 [TreeDynamicExample] findParentNode() for:",
      childNode.item,
      "at index:",
      childIndex,
      "level:",
      childNode.level
    );

    if (childIndex === -1) {
      console.log("🌳 [TreeDynamicExample] Child not found in data");
      return null;
    }

    if (childNode.level === 0) {
      console.log(
        "🌳 [TreeDynamicExample] Child is root level, returning null (no parent)"
      );
      return null;
    }

    // Look backwards for parent (node with level one less)
    for (let i = childIndex - 1; i >= 0; i--) {
      if (this.dataSource.data[i].level === childNode.level - 1) {
        console.log(
          "🌳 [TreeDynamicExample] Found parent:",
          this.dataSource.data[i].item
        );
        return this.dataSource.data[i];
      }
    }
    console.log("🌳 [TreeDynamicExample] No parent found");
    return null;
  }

  private createVirtualRootNode(): DynamicFlatNode {
    // Create a virtual root node for root-level operations
    return new DynamicFlatNode("__ROOT__", -1, true);
  }

  private getRootLevelChildren(): DynamicFlatNode[] {
    return this.dataSource.data.filter((node) => node.level === 0);
  }

  private getChildrenOfNode(parentNode: DynamicFlatNode): DynamicFlatNode[] {
    const parentIndex = this.dataSource.data.indexOf(parentNode);
    if (parentIndex === -1) return [];

    const children: DynamicFlatNode[] = [];
    for (let i = parentIndex + 1; i < this.dataSource.data.length; i++) {
      const node = this.dataSource.data[i];
      if (node.level <= parentNode.level) break;
      if (node.level === parentNode.level + 1) {
        children.push(node);
      }
    }
    return children;
  }

  private isDescendant(
    potentialDescendant: DynamicFlatNode,
    ancestor: DynamicFlatNode
  ): boolean {
    if (potentialDescendant.item === "__ROOT__") return false;

    const ancestorIndex = this.dataSource.data.indexOf(ancestor);
    const descendantIndex = this.dataSource.data.indexOf(potentialDescendant);

    if (ancestorIndex === -1 || descendantIndex === -1) return false;

    // Check if descendant comes after ancestor and has higher level
    return (
      descendantIndex > ancestorIndex &&
      potentialDescendant.level > ancestor.level &&
      this.isWithinSubtree(potentialDescendant, ancestor)
    );
  }

  private isWithinSubtree(
    node: DynamicFlatNode,
    subtreeRoot: DynamicFlatNode
  ): boolean {
    const rootIndex = this.dataSource.data.indexOf(subtreeRoot);
    const nodeIndex = this.dataSource.data.indexOf(node);

    if (rootIndex === -1 || nodeIndex === -1 || nodeIndex <= rootIndex)
      return false;

    // Find the end of the subtree
    for (let i = rootIndex + 1; i < this.dataSource.data.length; i++) {
      if (this.dataSource.data[i].level <= subtreeRoot.level) {
        return nodeIndex < i;
      }
    }

    return true; // Node is within subtree that extends to end of data
  }
}
