import { Fragment, ReactNode } from "react";

export interface DashboardComponent {
  id: string;
  render(): ReactNode;
}

export class DashboardLeaf implements DashboardComponent {
  constructor(
    public readonly id: string,
    private readonly content: ReactNode,
  ) {}

  render() {
    return this.content;
  }
}

export class DashboardGroup implements DashboardComponent {
  constructor(
    public readonly id: string,
    private readonly className: string,
    private readonly children: DashboardComponent[],
  ) {}

  render() {
    return (
      <div className={this.className}>
        {this.children.map((child) => (
          <Fragment key={child.id}>{child.render()}</Fragment>
        ))}
      </div>
    );
  }
}

export function renderDashboardComponent(component: DashboardComponent) {
  return <Fragment key={component.id}>{component.render()}</Fragment>;
}
