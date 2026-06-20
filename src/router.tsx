import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,           // 1 menit — data dianggap fresh selama 1 menit
        gcTime: 30 * 60 * 1000,          // 30 menit — cache bertahan 30 menit setelah unmount
        refetchOnWindowFocus: true,      // refresh saat user balik ke tab
        retry: 1,                        // hanya retry 1x jika gagal
        refetchOnMount: true,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
