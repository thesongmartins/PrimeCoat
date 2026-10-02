import { IMAGES } from "./images";

export type ProjectCategory = "living" | "bedroom" | "office" | "exterior" | "commercial" | "kitchen_bath";

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  living: "Living rooms",
  bedroom: "Bedrooms",
  office: "Offices",
  exterior: "Exterior walls",
  commercial: "Commercial spaces",
  kitchen_bath: "Kitchens & bathrooms",
};

export interface Project {
  id: string;
  title: string;
  location: string;
  category: ProjectCategory;
  colours: string[];
  image: { src: string; alt: string };
  /** Tailwind aspect classes to vary the gallery rhythm. */
  aspect: "square" | "tall" | "wide";
}

const P = IMAGES.projects;

export const PROJECTS: Project[] = [
  { id: "p1", title: "Forest-green feature wall", location: "Lekki Phase 1, Lagos", category: "living", colours: ["Lagoon Teal", "Harmattan Mist"], image: P.livingGreen, aspect: "wide" },
  { id: "p2", title: "Warm open-plan living", location: "Asokoro, Abuja", category: "living", colours: ["Sandstone", "Harmattan Mist"], image: P.livingWarm, aspect: "square" },
  { id: "p3", title: "Terracotta master bedroom", location: "Ikoyi, Lagos", category: "bedroom", colours: ["Iroko Earth", "Ceiling White"], image: P.bedroomOrange, aspect: "square" },
  { id: "p4", title: "Navy executive office", location: "Victoria Island, Lagos", category: "office", colours: ["Charcoal Night", "Slate Grey"], image: P.officeDark, aspect: "wide" },
  { id: "p5", title: "Dark-clad family home", location: "Magodo, Lagos", category: "exterior", colours: ["Charcoal Night", "Pure White"], image: P.exteriorDusk, aspect: "tall" },
  { id: "p6", title: "Sage kitchen-diner", location: "GRA, Port Harcourt", category: "living", colours: ["Sage Grove", "Brilliant White"], image: P.livingSage, aspect: "square" },
  { id: "p7", title: "Glass-partition workspace", location: "Ikeja, Lagos", category: "commercial", colours: ["Pure White", "Graphite"], image: P.officeGlass, aspect: "square" },
  { id: "p8", title: "White rendered villa", location: "Banana Island, Lagos", category: "exterior", colours: ["Pure White"], image: P.exteriorWhite, aspect: "wide" },
  { id: "p9", title: "Minimal city bedroom", location: "Wuse II, Abuja", category: "bedroom", colours: ["Harmattan Mist", "Ceiling White"], image: P.bedroomMinimal, aspect: "square" },
  { id: "p10", title: "Blush guest room", location: "Enugu", category: "bedroom", colours: ["Clay Rose"], image: P.bedroomBlush, aspect: "tall" },
  { id: "p11", title: "Gallery-wall living room", location: "Maitama, Abuja", category: "living", colours: ["Harmattan Mist"], image: P.livingGallery, aspect: "square" },
  { id: "p12", title: "Timber and black exterior", location: "Ibadan", category: "exterior", colours: ["Charcoal Night", "Dark Mahogany"], image: P.exteriorTimber, aspect: "square" },
  { id: "p13", title: "Refreshed white kitchen", location: "Surulere, Lagos", category: "kitchen_bath", colours: ["Brilliant White"], image: P.kitchen, aspect: "square" },
  { id: "p14", title: "Grey spa bathroom", location: "Lekki, Lagos", category: "kitchen_bath", colours: ["Slate Grey", "Pure White"], image: P.bathroom, aspect: "wide" },
];
