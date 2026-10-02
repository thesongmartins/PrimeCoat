import { SERVICE_TYPES, type ServiceType } from "@/types/service-request";

export function isServiceType(value: string): value is ServiceType {
  return (SERVICE_TYPES as readonly string[]).includes(value);
}
