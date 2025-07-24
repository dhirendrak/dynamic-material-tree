import {
  CollectionViewer,
  SelectionChange,
  DataSource,
} from "@angular/cdk/collections";
import { FlatTreeControl } from "@angular/cdk/tree";
import { BehaviorSubject, merge, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { DynamicFlatNode } from "./tree-dynamic-example";
import { DynamicDatabase } from "./dynamic-database";

/**
 * File database, it can build a tree structured Json object from string.
 * Each node in Json object represents a file or a directory. For a file, it has filename and type.
 * For a directory, it has filename and children (a list of files or directories).
 * The input will be a json object string, and the output is a list of `FileNode` with nested
 * structure.
 */
export class DynamicDataSource implements DataSource<DynamicFlatNode> {
  dataChange = new BehaviorSubject<DynamicFlatNode[]>([]);

  get data(): DynamicFlatNode[] {
    return this.dataChange.value;
  }
  set data(value: DynamicFlatNode[]) {
    this._treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(
    private _treeControl: FlatTreeControl<DynamicFlatNode>,
    private _database: DynamicDatabase
  ) {}

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

  moveNode(nodeToMove: DynamicFlatNode, newParentNode: DynamicFlatNode, oldParentNode: DynamicFlatNode, index?: number): void {
    // Handle virtual root node
    const newParentKey = newParentNode.item === '__ROOT__' ? '__ROOT__' : newParentNode.item;
    const oldParentKey = oldParentNode.item === '__ROOT__' ? '__ROOT__' : oldParentNode.item;
    
    if (newParentKey === '__ROOT__') {
      // Moving to root level
      this.moveToRootLevel(nodeToMove, oldParentKey, index);
    } else {
      this._database.moveNode(nodeToMove.item, newParentKey, oldParentKey, index);
    }
    
    // Remove node and its descendants from current position
    this.removeNodeFromDisplay(nodeToMove);
    
    // Refresh old parent's children if expanded (skip virtual root)
    if (oldParentNode.item !== '__ROOT__' && this._treeControl.isExpanded(oldParentNode)) {
      this.refreshParentChildren(oldParentNode);
    } else if (oldParentNode.item === '__ROOT__') {
      this.refreshRootLevel();
    }
    
    // Refresh new parent's children if expanded (skip virtual root)
    if (newParentNode.item !== '__ROOT__' && this._treeControl.isExpanded(newParentNode)) {
      this.refreshParentChildren(newParentNode);
    } else if (newParentNode.item === '__ROOT__') {
      this.refreshRootLevel();
    }
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

  private moveToRootLevel(nodeToMove: DynamicFlatNode, oldParentKey: string, index?: number): void {
    // Remove from old parent
    if (oldParentKey !== '__ROOT__') {
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
    if (index !== undefined && index >= 0 && index <= this._database.rootLevelNodes.length) {
      this._database.rootLevelNodes.splice(index, 0, nodeToMove.item);
    } else {
      this._database.rootLevelNodes.push(nodeToMove.item);
    }
  }

  private refreshRootLevel(): void {
    // Rebuild the entire data array starting with root nodes
    const newData: DynamicFlatNode[] = [];
    
    this._database.rootLevelNodes.forEach(rootName => {
      const rootNode = new DynamicFlatNode(rootName, 0, this._database.isExpandable(rootName));
      newData.push(rootNode);
      
      // If root node is expanded, add its children
      if (this._treeControl.isExpanded(rootNode)) {
        this.addExpandedChildren(rootNode, newData);
      }
    });
    
    this.data = newData;
  }

  private addExpandedChildren(parentNode: DynamicFlatNode, dataArray: DynamicFlatNode[]): void {
    const children = this._database.getChildren(parentNode.item);
    if (!children) return;
    
    children.forEach(childName => {
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
    for (let i = parentIndex + 1; i < this.data.length && this.data[i].level > parentNode.level; i++) {
      childCount++;
    }
    this.data.splice(parentIndex + 1, childCount);

    // Add updated children
    const children = this._database.getChildren(parentNode.item);
    if (children) {
      const nodes = children.map(
        (name) => new DynamicFlatNode(
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
    if (nodeIndex === -1) return;

    // Count descendants to remove
    let count = 1; // Include the node itself
    for (let i = nodeIndex + 1; i < this.data.length && this.data[i].level > node.level; i++) {
      count++;
    }

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
  toggleNode(node: DynamicFlatNode, expand: boolean) {
    const children = this._database.getChildren(node.item);
    const index = this.data.indexOf(node);
    if (!children || index < 0) {
      // If no children, or cannot find the node, no op
      return;
    }

    node.isLoading.set(true);

    setTimeout(() => {
      if (expand) {
        const nodes = children.map(
          (name) =>
            new DynamicFlatNode(
              name,
              node.level + 1,
              this._database.isExpandable(name)
            )
        );
        this.data.splice(index + 1, 0, ...nodes);
      } else {
        let count = 0;
        for (
          let i = index + 1;
          i < this.data.length && this.data[i].level > node.level;
          i++, count++
        ) {}
        this.data.splice(index + 1, count);
      }

      // notify the change
      this.dataChange.next(this.data);
      node.isLoading.set(false);
    }, 1000);
  }
}