import type { ServiceType } from "@/types/service-request";

export interface ServiceContent {
  type: ServiceType;
  title: string;
  summary: string;
  details: string[];
}

export const SERVICES: ServiceContent[] = [
  {
    type: "residential",
    title: "Residential Painting",
    summary: "Transform homes with professional interior and exterior painting.",
    details: [
      "Flats, duplexes and detached homes",
      "Furniture moved, floors and fittings protected",
      "Two-coat system with PrimeCoat emulsions",
    ],
  },
  {
    type: "commercial",
    title: "Commercial Painting",
    summary: "Professional painting solutions for offices, shops and commercial spaces.",
    details: [
      "Out-of-hours and phased scheduling",
      "Brand-colour matching",
      "Durable, washable finishes for high traffic",
    ],
  },
  {
    type: "interior",
    title: "Interior Painting",
    summary: "Walls, ceilings, doors and trims finished to a crisp, even standard.",
    details: ["Cutting-in by hand", "Ceilings and cornices", "Doors, frames and skirting in enamel"],
  },
  {
    type: "exterior",
    title: "Exterior Painting",
    summary: "Weatherproof façades, boundary walls and gates built for the climate.",
    details: ["Pressure washing and fungicidal wash", "Crack repair and render patching", "WeatherShield and elastomeric systems"],
  },
  {
    type: "colour_consultation",
    title: "Colour Consultation",
    summary: "Get help choosing colours that work with your space, light and furniture.",
    details: ["On-site or virtual sessions", "Sample pots and large-format swatches", "A written palette plan for every room"],
  },
  {
    type: "surface_preparation",
    title: "Surface Preparation",
    summary: "Skimming, filling, sanding and priming for a finish that lasts.",
    details: ["Screeding and skim coats", "Alkali-resisting and universal primers", "Mould and damp treatment"],
  },
  {
    type: "repainting",
    title: "Repainting",
    summary: "Refresh tired walls and update colours without the mess of a full renovation.",
    details: ["Washing and light sanding", "Spot priming of repairs", "Same-colour refresh or full colour change"],
  },
];

export const WHY_PRIMECOAT = [
  {
    title: "Premium-quality paints",
    body: "Every emulsion and enamel is formulated for high opacity, true colour and long life in Nigerian heat and humidity.",
  },
  {
    title: "Professional finishing",
    body: "Our painters prepare properly, cut in by hand and apply full two-coat systems — the difference you can see and touch.",
  },
  {
    title: "Expert colour guidance",
    body: "Not sure which white, grey or green? Our consultants help you choose colours that suit your light and your furniture.",
  },
  {
    title: "Reliable delivery",
    body: "Orders are packed carefully and delivered to your door across Nigeria, with clear fees shown before you pay.",
  },
  {
    title: "Skilled painters",
    body: "Vetted, trained crews who turn up on time, protect your home and leave it clean.",
  },
];
