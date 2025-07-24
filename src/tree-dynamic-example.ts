import { FlatTreeControl } from "@angular/cdk/tree";
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTreeModule } from "@angular/material/tree";
import { DynamicDatabase } from "./dynamic-database";
import { DynamicDataSource } from "./dynamic-data-source";

/** Flat node with expandable and level information */
export class DynamicFlatNode {
  constructor(
    public item: string,
    public level = 1,
    public expandable = false,
    public isLoading = signal(false)
  ) {}
}

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-tree [dataSource]="dataSource" [treeControl]="treeControl">
      <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
        <button mat-icon-button disabled></button>
        {{ node.item }}
      </mat-tree-node>
      <mat-tree-node
        *matTreeNodeDef="let node; when: hasChild"
        matTreeNodePadding
        matTreeNodeToggle
        [cdkTreeNodeTypeaheadLabel]="node.item"
      >
        <button
          mat-icon-button
          [attr.aria-label]="'Toggle ' + node.item"
          matTreeNodeToggle
        >
          <mat-icon class="mat-icon-rtl-mirror">
            {{ treeControl.isExpanded(node) ? "expand_more" : "chevron_right" }}
          </mat-icon>
        </button>
        {{ node.item }}
        @if (node.isLoading()) {
        <mat-progress-bar
          mode="indeterminate"
          class="example-tree-progress-bar"
        ></mat-progress-bar>
        }
      </mat-tree-node>
    </mat-tree>
  `,
  styles: [
    `
      .example-tree-progress-bar {
        margin-left: 30px;
      }
    `,
  ],
})
export class TreeDynamicExample {
  constructor() {
    const database = inject(DynamicDatabase);

    this.treeControl = new FlatTreeControl<DynamicFlatNode>(
      this.getLevel,
      this.isExpandable
    );
    this.dataSource = new DynamicDataSource(this.treeControl, database);

    this.dataSource.data = database.initialData();
  }

  treeControl: FlatTreeControl<DynamicFlatNode>;

  dataSource: DynamicDataSource;

  getLevel = (node: DynamicFlatNode) => node.level;

  isExpandable = (node: DynamicFlatNode) => node.expandable;

  hasChild = (_: number, _nodeData: DynamicFlatNode) => _nodeData.expandable;
}
