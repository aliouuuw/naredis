import type { AuthContext } from "./session";
import type { ModuleContext } from "@/lib/modules/shared/types";

export function toModuleContext(ctx: AuthContext): ModuleContext {
  return {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
  };
}
