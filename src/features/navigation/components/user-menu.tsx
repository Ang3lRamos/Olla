import { isAdmin } from "@/features/admin/access";
import { countPendingRefunds } from "@/features/admin/data";
import { getCurrentUser } from "@/features/household/data";
import { UserMenuPopover } from "./user-menu-popover";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;
  const admin = await isAdmin();
  return (
    <UserMenuPopover
      email={user.email ?? "Tu cuenta"}
      isAdmin={admin}
      pendingRefunds={admin ? await countPendingRefunds() : 0}
    />
  );
}
