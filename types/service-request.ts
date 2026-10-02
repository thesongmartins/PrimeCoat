export const SERVICE_TYPES = [
  "residential",
  "commercial",
  "interior",
  "exterior",
  "colour_consultation",
  "surface_preparation",
  "repainting",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  residential: "Residential painting",
  commercial: "Commercial painting",
  interior: "Interior painting",
  exterior: "Exterior painting",
  colour_consultation: "Colour consultation",
  surface_preparation: "Surface preparation",
  repainting: "Repainting",
};

export const PROPERTY_TYPES = [
  "flat",
  "detached_house",
  "duplex",
  "office",
  "shop",
  "warehouse",
  "other",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  flat: "Flat / apartment",
  detached_house: "Detached house",
  duplex: "Duplex",
  office: "Office",
  shop: "Shop / retail",
  warehouse: "Warehouse / industrial",
  other: "Other",
};
