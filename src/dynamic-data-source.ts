import {
  CollectionViewer,
  SelectionChange,
  DataSource,
} from "@angular/cdk/collections";
import { FlatTreeControl } from "@angular/cdk/tree";
import { inject } from "@angular/core";
import { BehaviorSubject, merge, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { DynamicDatabase } from "./dynamic-database";
import { DynamicFlatNode } from "./dynamic-flat-node";

/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
export class DynamicDataSource implements DataSource<DynamicFlatNode> {
  private readonly _database = inject(DynamicDatabase);
  dataChange = new BehaviorSubject<DynamicFlatNode[]>([]);

  get data(): DynamicFlatNode[] {
    return this.dataChange.value;
  }
  set data(value: DynamicFlatNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(private _treeControl: FlatTreeControl<DynamicFlatNode>) {}

  connect(collectionViewer: CollectionViewer): Observable<DynamicFlatNode[]> {
    this._treeControl.expansionModel.changed.subscribe((change) => {
      if (
        (change as SelectionChange<DynamicFlatNode>).added ||
        (change as SelectionChange<DynamicFlatNode>).removed
      ) {
        this.handleTreeControl(change as SelectionChange<DynamicFlatNode>);
      }
    });

    return merge(collectionViewer.viewChange, this.dataChange).pipe(
      map(() => this.data)
    );
  }

  disconnect(collectionViewer: CollectionViewer): void {}

  addChildNode(parentNode: DynamicFlatNode, newChildName: string): void {
    this._database.addChild(parentNode.item, newChildName);

    // Only refresh if parent is currently expanded
    if (this._treeControl.isExpanded(parentNode)) {
      this.refreshParentChildren(parentNode);
    }
  }

  moveNode(
    nodeToMove: DynamicFlatNode,
    newParentNode: DynamicFlatNode,
    oldParentNode: DynamicFlatNode,
    index?: number
  ): void {
    console.log('📊 [DynamicDataSource] moveNode() called:', {
      nodeToMove: nodeToMove.item,
      newParent: newParentNode.item,
      oldParent: oldParentNode.item,
      index
    });

    // Handle virtual root node
    const newParentKey =
      newParentNode.item === "__ROOT__" ? "__ROOT__" : newParentNode.item;
    const oldParentKey =
      oldParentNode.item === "__ROOT__" ? "__ROOT__" : oldParentNode.item;

    console.log('📊 [DynamicDataSource] Parent keys:', { newParentKey, oldParentKey });

    if (newParentKey === "__ROOT__") {
      // Moving to root level
      console.log('📊 [DynamicDataSource] Moving to root level');
      this.moveToRootLevel(nodeToMove, oldParentKey, index);
    } else {
      console.log('📊 [DynamicDataSource] Moving to regular parent, calling database.moveNode()');
      this._database.moveNode(
        nodeToMove.item,
        newParentKey,
        oldParentKey,
        index
      );
    }

    // Remove node and its descendants from current position
    console.log('📊 [DynamicDataSource] Removing node from display');
    this.removeNodeFromDisplay(nodeToMove);

    // Refresh old parent's children if expanded (skip virtual root)
    if (
      oldParentNode.item !== "__ROOT__" &&
      this._treeControl.isExpanded(oldParentNode)
    ) {
      console.log('📊 [DynamicDataSource] Refreshing old parent children:', oldParentNode.item);
      this.refreshParentChildren(oldParentNode);
    } else if (oldParentNode.item === "__ROOT__") {
      console.log('📊 [DynamicDataSource] Refreshing root level (old parent)');
      this.refreshRootLevel();
    }

    // Refresh new parent's children if expanded (skip virtual root)
    if (
      newParentNode.item !== "__ROOT__" &&
      this._treeControl.isExpanded(newParentNode)
    ) {
      console.log('📊 [DynamicDataSource] Refreshing new parent children:', newParentNode.item);
      this.refreshParentChildren(newParentNode);
    } else if (newParentNode.item === "__ROOT__") {
      console.log('📊 [DynamicDataSource] Refreshing root level (new parent)');
      this.refreshRootLevel();
    }

    console.log('📊 [DynamicDataSource] moveNode() completed');
  }

  removeNode(nodeToRemove: DynamicFlatNode): void {
    const parentNode = this.findParentNode(nodeToRemove);
    this._database.removeNode(nodeToRemove.item);

    // Remove from display
    this.removeNodeFromDisplay(nodeToRemove);

    // Refresh parent if expanded
    if (parentNode && this._treeControl.isExpanded(parentNode)) {
      this.refreshParentChildren(parentNode);
    }
  }

  private moveToRootLevel(
    nodeToMove: DynamicFlatNode,
    oldParentKey: string,
    index?: number
  ): void {
    // Remove from old parent
    if (oldParentKey !== "__ROOT__") {
      const oldParentChildren = this._database.dataMap.get(oldParentKey);
      if (oldParentChildren) {
        const oldIndex = oldParentChildren.indexOf(nodeToMove.item);
        if (oldIndex > -1) {
          oldParentChildren.splice(oldIndex, 1);
        }
      }
    } else {
      // Remove from root level
      const rootIndex = this._database.rootLevelNodes.indexOf(nodeToMove.item);
      if (rootIndex > -1) {
        this._database.rootLevelNodes.splice(rootIndex, 1);
      }
    }

    // Add to root level at specific index
    if (
      index !== undefined &&
      index >= 0 &&
      index <= this._database.rootLevelNodes.length
    ) {
      this._database.rootLevelNodes.splice(index, 0, nodeToMove.item);
    } else {
      this._database.rootLevelNodes.push(nodeToMove.item);
    }
  }

  private refreshRootLevel(): void {
    console.log('📊 [DynamicDataSource] refreshRootLevel() called');
    // Rebuild the entire data array starting with root nodes
    const newData: DynamicFlatNode[] = [];

    this._database.rootLevelNodes.forEach((rootName) => {
      console.log('📊 [DynamicDataSource] Processing root node:', rootName);
      const rootNode = new DynamicFlatNode(
        rootName,
        0,
        this._database.isExpandable(rootName)
      );
      newData.push(rootNode);

      // If root node is expanded, add its children
      if (this._treeControl.isExpanded(rootNode)) {
        console.log('📊 [DynamicDataSource] Root node is expanded, adding children');
        this.addExpandedChildren(rootNode, newData);
      }
    });

    console.log('📊 [DynamicDataSource] Setting new data with', newData.length, 'nodes');
    this.data = newData;
  }

  private addExpandedChildren(
    parentNode: DynamicFlatNode,
    dataArray: DynamicFlatNode[]
  ): void {
    // Use synchronous method for already loaded data during refresh operations
    const children = this._database.getChildren(parentNode.item);
    if (!children) return;

    children.forEach((childName) => {
      const childNode = new DynamicFlatNode(
        childName,
        parentNode.level + 1,
        this._database.isExpandable(childName)
      );
      dataArray.push(childNode);

      // Recursively add expanded children
      if (this._treeControl.isExpanded(childNode)) {
        this.addExpandedChildren(childNode, dataArray);
      }
    });
  }

  private refreshParentChildren(parentNode: DynamicFlatNode): void {
    const parentIndex = this.data.indexOf(parentNode);
    if (parentIndex === -1) return;

    // Remove existing children
    let childCount = 0;
    for (
      let i = parentIndex + 1;
      i < this.data.length && this.data[i].level > parentNode.level;
      i++
    ) {
      childCount++;
    }
    this.data.splice(parentIndex + 1, childCount);

    // Add updated children (use synchronous method for refresh operations)
    const children = this._database.getChildren(parentNode.item);
    if (children) {
      const nodes = children.map(
        (name) =>
          new DynamicFlatNode(
            name,
            parentNode.level + 1,
            this._database.isExpandable(name)
          )
      );
      this.data.splice(parentIndex + 1, 0, ...nodes);
    }

    this.dataChange.next(this.data);
  }

  private removeNodeFromDisplay(node: DynamicFlatNode): void {
    const nodeIndex = this.data.indexOf(node);
    console.log('📊 [DynamicDataSource] removeNodeFromDisplay() for:', node.item, 'at index:', nodeIndex);
    
    if (nodeIndex === -1) {
      console.log('📊 [DynamicDataSource] Node not found in display, returning');
      return;
    }

    // Count descendants to remove
    let count = 1; // Include the node itself
    for (
      let i = nodeIndex + 1;
      i < this.data.length && this.data[i].level > node.level;
      i++
    ) {
      count++;
    }

    console.log('📊 [DynamicDataSource] Removing', count, 'nodes from display starting at index:', nodeIndex);
    this.data.splice(nodeIndex, count);
    this.dataChange.next(this.data);
  }

  private findParentNode(childNode: DynamicFlatNode): DynamicFlatNode | null {
    const childIndex = this.data.indexOf(childNode);
    if (childIndex === -1 || childNode.level === 0) return null;

    // Look backwards for parent (node with level one less)
    for (let i = childIndex - 1; i >= 0; i--) {
      if (this.data[i].level === childNode.level - 1) {
        return this.data[i];
      }
    }
    return null;
  }

  /** Handle expand/collapse behaviors */
  handleTreeControl(change: SelectionChange<DynamicFlatNode>) {
    console.log('📊 [DynamicDataSource] handleTreeControl() called with change:', {
      added: change.added?.map(n => n.item),
      removed: change.removed?.map(n => n.item)
    });
    
    if (change.added) {
      change.added.forEach((node) => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed
        .slice()
        .reverse()
        .forEach((node) => this.toggleNode(node, false));
    }
  }

  /**
   * Toggle the node, remove from display list
   */
  async toggleNode(node: DynamicFlatNode, expand: boolean) {
    const index = this.data.indexOf(node);
    console.log('📊 [DynamicDataSource] toggleNode() called:', {
      node: node.item,
      expand,
      index
    });
    
    if (index < 0) {
      console.log('📊 [DynamicDataSource] Cannot find node in data, returning');
      // Cannot find the node, no op
      return;
    }

    if (expand) {
      console.log('📊 [DynamicDataSource] Expanding node, setting loading state');
      node.isLoading.set(true);

      try {
        const children = await this._database.getChildrenAsync(node.item);
        console.log('📊 [DynamicDataSource] Received children:', children);

        if (children) {
          const nodes = children.map(
            (name) =>
              new DynamicFlatNode(
                name,
                node.level + 1,
                this._database.isExpandable(name)
              )
          );
          console.log('📊 [DynamicDataSource] Adding', nodes.length, 'child nodes at index:', index + 1);
          this.data.splice(index + 1, 0, ...nodes);
        }
      } finally {
        console.log('📊 [DynamicDataSource] Clearing loading state');
        node.isLoading.set(false);
      }
    } else {
      // Collapse - no async needed
      let count = 0;
      for (
        let i = index + 1;
        i < this.data.length && this.data[i].level > node.level;
        i++, count++
      ) {}
      console.log('📊 [DynamicDataSource] Collapsing node, removing', count, 'descendants');
      this.data.splice(index + 1, count);
    }

    // notify the change
    console.log('📊 [DynamicDataSource] Notifying data change, new data length:', this.data.length);
    this.dataChange.next(this.data);
  }
}
