import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";

function setupAt(path: string) {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  // Robot sob React 19: os elementos de documento (html/head/body) saem do
  // container, então o DOM não é sinal confiável de montagem — usamos o
  // estado do router, que independe de página específica.
  render(<RouterProvider router={router} />);
  return router;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Assert only that the router mounts and paints, never page content:
// routes are rewritten as the app is built and this must keep passing.
describe("App routing", () => {
  it("renders the index route", async () => {
    const router = setupAt("/");

    await waitFor(() => expect(router.state.matches.length).toBeGreaterThan(0));
    expect(router.state.location.pathname).toBe("/");
  });

  it("renders the not-found route", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const router = setupAt("/this-route-does-not-exist");

    await waitFor(() => expect(router.state.matches.length).toBeGreaterThan(0));
    expect(router.state.location.pathname).toBe("/this-route-does-not-exist");
  });
});
