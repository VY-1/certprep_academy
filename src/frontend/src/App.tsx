import { Layout } from "@/components/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// Lazy-load pages for code splitting
const HomePage = lazy(() =>
  import("@/pages/HomePage").then((m) => ({ default: m.HomePage })),
);
const ExamSelectPage = lazy(() =>
  import("@/pages/ExamSelectPage").then((m) => ({ default: m.ExamSelectPage })),
);
const ExamTakingPage = lazy(() =>
  import("@/pages/ExamTakingPage").then((m) => ({ default: m.ExamTakingPage })),
);
const ResultsPage = lazy(() =>
  import("@/pages/ResultsPage").then((m) => ({ default: m.ResultsPage })),
);
const HistoryPage = lazy(() =>
  import("@/pages/HistoryPage").then((m) => ({ default: m.HistoryPage })),
);

function PageLoader() {
  return (
    <div className="flex-1 flex flex-col gap-4 p-8 max-w-2xl mx-auto w-full">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-32 w-full mt-4" />
    </div>
  );
}

// Root route — renders Outlet for all child routes
const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <HomePage />
      </Suspense>
    </Layout>
  ),
});

const examSelectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exams/$examId",
  component: () => (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <ExamSelectPage />
      </Suspense>
    </Layout>
  ),
});

const examTakingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/exam/$versionId",
  component: () => (
    <Layout examMode>
      <Suspense fallback={<PageLoader />}>
        <ExamTakingPage />
      </Suspense>
    </Layout>
  ),
});

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results/$versionId",
  component: () => (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <ResultsPage />
      </Suspense>
    </Layout>
  ),
});

const historyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/history",
  component: () => (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <HistoryPage />
      </Suspense>
    </Layout>
  ),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  examSelectRoute,
  examTakingRoute,
  resultsRoute,
  historyRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
