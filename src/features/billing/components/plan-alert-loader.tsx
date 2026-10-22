import { getCurrentHousehold } from "@/features/household/data";
import { getEntitlement } from "../data";
import { planNotice } from "../plan-notice";
import { PlanAlert } from "./plan-alert";

/** Busca si hay algo que avisar del plan; sin aviso no se manda nada al navegador. */
export async function PlanAlertLoader() {
  const household = await getCurrentHousehold();
  if (!household) return null;
  const entitlement = await getEntitlement(household.id);
  const notice = planNotice(entitlement, new Date());
  if (!notice || !entitlement?.expiresAt) return null;
  return <PlanAlert notice={notice} noticeKey={entitlement.expiresAt} />;
}
