import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
  DashboardLeaf,
  DashboardGroup,
  renderDashboardComponent,
} from "@/components/dashboard/DashboardComposite";

describe("DashboardComposite", () => {
  it("DashboardLeaf renders its content", () => {
    const leaf = new DashboardLeaf("leaf-1", <div>Leaf Content</div>);
    render(leaf.render() as any);

    expect(screen.getByText("Leaf Content")).toBeInTheDocument();
  });

  it("DashboardGroup renders its children", () => {
    const leaf1 = new DashboardLeaf("leaf-1", <div>Content 1</div>);
    const leaf2 = new DashboardLeaf("leaf-2", <div>Content 2</div>);
    const group = new DashboardGroup("group-1", "test-class", [leaf1, leaf2]);

    const { container } = render(group.render() as any);

    expect(screen.getByText("Content 1")).toBeInTheDocument();
    expect(screen.getByText("Content 2")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("test-class");
  });

  it("renderDashboardComponent renders composite correctly", () => {
    const leaf = new DashboardLeaf("leaf-1", <div>Composite Content</div>);
    const result = renderDashboardComponent(leaf);

    render(result);

    expect(screen.getByText("Composite Content")).toBeInTheDocument();
  });
});
