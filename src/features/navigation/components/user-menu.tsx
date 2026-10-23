import { isAdmin } from "@/features/admin/access";
import { getCurrentUser } from "@/features/household/data";
import { UserMenuPopover } from "./user-menu-popover";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) return null;
  return <UserMenuPopover email={user.email ?? "Tu cuenta"} isAdmin={await isAdmin()} />;
}
