import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useArrowGridNav } from "../hooks/useArrowGridNav";

afterEach(() => cleanup());

const ITEMS: ReadonlyArray<{ id: string; label: string }> = [
  { id: "alpha", label: "alpha" },
  { id: "bravo", label: "bravo" },
  { id: "charlie", label: "charlie" },
];

function Grid({ count }: { count: number }) {
  const ref = useArrowGridNav<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="grid">
      {ITEMS.slice(0, count).map((item, i) => (
        <button key={item.id} type="button" data-arrow-nav-item="x" data-testid={`btn-${i}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

describe("useArrowGridNav", () => {
  it("ArrowRight focuses the next item", () => {
    const r = render(<Grid count={3} />);
    const btn0 = r.getByTestId("btn-0");
    btn0.focus();
    fireEvent.keyDown(r.getByTestId("grid"), { key: "ArrowRight" });
    expect(document.activeElement).toBe(r.getByTestId("btn-1"));
  });

  it("ArrowLeft wraps from first to last", () => {
    const r = render(<Grid count={3} />);
    r.getByTestId("btn-0").focus();
    fireEvent.keyDown(r.getByTestId("grid"), { key: "ArrowLeft" });
    expect(document.activeElement).toBe(r.getByTestId("btn-2"));
  });

  it("Home jumps to the first item", () => {
    const r = render(<Grid count={3} />);
    r.getByTestId("btn-2").focus();
    fireEvent.keyDown(r.getByTestId("grid"), { key: "Home" });
    expect(document.activeElement).toBe(r.getByTestId("btn-0"));
  });

  it("End jumps to the last item", () => {
    const r = render(<Grid count={3} />);
    r.getByTestId("btn-0").focus();
    fireEvent.keyDown(r.getByTestId("grid"), { key: "End" });
    expect(document.activeElement).toBe(r.getByTestId("btn-2"));
  });

  it("ArrowDown also advances (treats grid as flat ring)", () => {
    const r = render(<Grid count={3} />);
    r.getByTestId("btn-0").focus();
    fireEvent.keyDown(r.getByTestId("grid"), { key: "ArrowDown" });
    expect(document.activeElement).toBe(r.getByTestId("btn-1"));
  });

  it("non-arrow keys do nothing", () => {
    const r = render(<Grid count={3} />);
    r.getByTestId("btn-0").focus();
    fireEvent.keyDown(r.getByTestId("grid"), { key: "x" });
    expect(document.activeElement).toBe(r.getByTestId("btn-0"));
  });
});
