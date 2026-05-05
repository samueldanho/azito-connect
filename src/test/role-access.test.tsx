import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { AppRole } from "@/hooks/useUserRole";

// ---- Mocks ----
const mockUser = { id: "user-1", email: "test@test.com" } as any;

let currentRoles: AppRole[] = [];

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/hooks/useUserRole", async () => {
  const actual: any = {};
  return {
    ...actual,
    useUserRole: () => {
      const hasRole = (allowed: AppRole[]) =>
        currentRoles.some((r) => allowed.includes(r));
      return {
        roles: currentRoles,
        isBerger: currentRoles.includes("berger"),
        isResponsable: currentRoles.includes("responsable_service"),
        hasRole,
        isLoading: false,
      };
    },
  };
});

// Lightweight mock for ChurchLogo (avoids loading assets)
vi.mock("@/components/icons/ChurchLogo", () => ({
  ChurchLogo: () => <div data-testid="church-logo" />,
}));

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

// ---- Routes matrix (must mirror src/App.tsx) ----
const routesMatrix: { path: string; allowed: AppRole[] }[] = [
  { path: "/dashboard", allowed: ["berger", "responsable_service"] },
  { path: "/dashboard/membres", allowed: ["berger", "responsable_service"] },
  { path: "/dashboard/presences", allowed: ["berger", "responsable_service"] },
  { path: "/dashboard/services", allowed: ["berger"] },
  { path: "/dashboard/statistiques", allowed: ["berger", "responsable_service"] },
  { path: "/dashboard/parametres", allowed: ["berger", "responsable_service"] },
  { path: "/dashboard/responsables", allowed: ["berger"] },
  { path: "/dashboard/logs", allowed: ["berger"] },
  { path: "/dashboard/bus-center", allowed: ["berger", "responsable_service"] },
];

const renderRoute = (path: string, allowed: AppRole[]) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path={path}
          element={
            <ProtectedRoute allowedRoles={allowed}>
              <div>PAGE_OK</div>
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<div>UNAUTHORIZED_PAGE</div>} />
        <Route path="/auth" element={<div>AUTH_PAGE</div>} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  currentRoles = [];
});

describe("ProtectedRoute — RESPONSABLE_SERVICE", () => {
  beforeEach(() => {
    currentRoles = ["responsable_service"];
  });

  const forbidden = routesMatrix.filter(
    (r) => !r.allowed.includes("responsable_service")
  );
  const allowed = routesMatrix.filter((r) =>
    r.allowed.includes("responsable_service")
  );

  forbidden.forEach(({ path, allowed: roles }) => {
    it(`redirige ${path} vers /unauthorized`, () => {
      renderRoute(path, roles);
      expect(screen.getByText("UNAUTHORIZED_PAGE")).toBeInTheDocument();
      expect(screen.queryByText("PAGE_OK")).not.toBeInTheDocument();
    });
  });

  allowed.forEach(({ path, allowed: roles }) => {
    it(`autorise ${path}`, () => {
      renderRoute(path, roles);
      expect(screen.getByText("PAGE_OK")).toBeInTheDocument();
    });
  });
});

describe("ProtectedRoute — BERGER", () => {
  beforeEach(() => {
    currentRoles = ["berger"];
  });

  routesMatrix.forEach(({ path, allowed }) => {
    it(`autorise ${path}`, () => {
      renderRoute(path, allowed);
      expect(screen.getByText("PAGE_OK")).toBeInTheDocument();
    });
  });
});

describe("ProtectedRoute — utilisateur sans rôle", () => {
  beforeEach(() => {
    currentRoles = [];
  });

  it("redirige vers /unauthorized si aucun rôle assigné", () => {
    renderRoute("/dashboard", ["berger", "responsable_service"]);
    expect(screen.getByText("UNAUTHORIZED_PAGE")).toBeInTheDocument();
  });
});

// ---- Sidebar role-based rendering ----
const sidebarItemsByRole = {
  berger: [
    "Tableau de bord",
    "Membres",
    "Présences",
    "Services",
    "Statistiques",
    "Responsables",
    "Bus-Center",
    "Logs CRM",
    "Paramètres",
  ],
  responsable_service: [
    "Tableau de bord",
    "Membres",
    "Présences",
    "Statistiques",
    "Bus-Center",
    "Paramètres",
  ],
};
const hiddenForResponsable = ["Services", "Responsables", "Logs CRM"];

const renderSidebar = () =>
  render(
    <MemoryRouter>
      <DashboardSidebar isCollapsed={false} onToggle={() => {}} />
    </MemoryRouter>
  );

describe("DashboardSidebar — filtrage par rôle", () => {
  it("BERGER voit les 9 items", () => {
    currentRoles = ["berger"];
    renderSidebar();
    sidebarItemsByRole.berger.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("RESPONSABLE_SERVICE voit 6 items et ne voit pas Services / Responsables / Logs CRM", () => {
    currentRoles = ["responsable_service"];
    renderSidebar();
    sidebarItemsByRole.responsable_service.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
    hiddenForResponsable.forEach((label) => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });
  });

  it("Utilisateur sans rôle ne voit aucun item de menu", () => {
    currentRoles = [];
    renderSidebar();
    [...sidebarItemsByRole.berger].forEach((label) => {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    });
  });
});
