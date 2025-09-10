import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { ALLOWED_MODELS, DEFAULT_MODEL } from "../lib/ai-models";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  allowedModels: publicProcedure.query(() => {
    return {
      models: ALLOWED_MODELS,
      defaultModel: DEFAULT_MODEL,
    } as const;
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.user,
      aiModel: ctx.aiModel ?? null,
    };
  }),
});
export type AppRouter = typeof appRouter;
