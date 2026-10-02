import type { Product, ProductCategory } from "@/types/product";

/**
 * Static catalogue. This is the single source for:
 *  - Phase 2 UI rendering (before Supabase is wired)
 *  - supabase/seed.sql generation (scripts/seed.ts)
 *  - scripts/generate-product-images.ts
 *
 * IDs are fixed UUIDs so seeds are idempotent and cart items keep working across phases.
 */

type SeedInput = Omit<Product, "createdAt" | "updatedAt" | "imageUrl" | "isActive"> & {
  isActive?: boolean;
};

const CREATED = "2026-09-01T09:00:00.000Z";

function id(n: number): string {
  return `a1000000-0000-4000-8000-${n.toString().padStart(12, "0")}`;
}

function product(input: SeedInput): Product {
  return {
    ...input,
    isActive: input.isActive ?? true,
    imageUrl: `/images/products/${input.slug}.svg`,
    createdAt: CREATED,
    updatedAt: CREATED,
  };
}

const VELVET_MATT_DESC =
  "A rich, chalky matt emulsion with exceptional opacity and depth of colour. Low-odour, quick-drying and washable once cured, it hides minor surface imperfections and gives living rooms, bedrooms and hallways a soft, light-diffusing finish.";
const SILK_DESC =
  "A mid-sheen emulsion that balances elegance with durability. The silk finish reflects light gently, resists scuffs and wipes clean, making it ideal for kitchens, corridors and children's rooms.";
const WEATHERSHIELD_DESC =
  "A premium exterior emulsion engineered for the Nigerian climate. Formulated with UV-stable pigments and a breathable acrylic binder, it resists fading, algae and heavy harmattan dust while letting moisture escape from the wall.";

export const SEED_PRODUCTS: Product[] = [
  // ---------------------------------------------------------------- interior
  product({
    id: id(1), name: "Velvet Matt Interior Emulsion", slug: "velvet-matt-harmattan-mist-4l",
    category: "interior", price: 18500, size: "4 L", colourName: "Harmattan Mist", colourHex: "#EDE6DA",
    finish: "Matt", coverage: "12–14 m² per litre per coat", stockQuantity: 48, isFeatured: true,
    shortDescription: "Chalky, light-diffusing matt in a soft warm white.",
    description: VELVET_MATT_DESC,
  }),
  product({
    id: id(2), name: "Velvet Matt Interior Emulsion", slug: "velvet-matt-harmattan-mist-20l",
    category: "interior", price: 82000, size: "20 L", colourName: "Harmattan Mist", colourHex: "#EDE6DA",
    finish: "Matt", coverage: "12–14 m² per litre per coat", stockQuantity: 16, isFeatured: false,
    shortDescription: "Contractor pack of our best-selling warm white matt.",
    description: VELVET_MATT_DESC,
  }),
  product({
    id: id(3), name: "Silk Sheen Interior Emulsion", slug: "silk-sheen-clay-rose-4l",
    category: "interior", price: 21000, size: "4 L", colourName: "Clay Rose", colourHex: "#D9A99A",
    finish: "Silk", coverage: "11–13 m² per litre per coat", stockQuantity: 22, isFeatured: true,
    shortDescription: "Wipeable mid-sheen in a muted, sun-warmed pink.",
    description: SILK_DESC,
  }),
  product({
    id: id(4), name: "Silk Sheen Interior Emulsion", slug: "silk-sheen-lagoon-teal-4l",
    category: "interior", price: 21000, size: "4 L", colourName: "Lagoon Teal", colourHex: "#2F5F5C",
    finish: "Silk", coverage: "11–13 m² per litre per coat", stockQuantity: 14, isFeatured: false,
    shortDescription: "Deep, calming teal for feature walls and studies.",
    description: SILK_DESC,
  }),
  product({
    id: id(5), name: "Velvet Matt Interior Emulsion", slug: "velvet-matt-sage-grove-4l",
    category: "interior", price: 18500, size: "4 L", colourName: "Sage Grove", colourHex: "#9AA88F",
    finish: "Matt", coverage: "12–14 m² per litre per coat", stockQuantity: 31, isFeatured: true,
    shortDescription: "Soft botanical green that pairs with timber and brass.",
    description: VELVET_MATT_DESC,
  }),
  product({
    id: id(6), name: "Velvet Matt Interior Emulsion", slug: "velvet-matt-iroko-earth-4l",
    category: "interior", price: 18500, size: "4 L", colourName: "Iroko Earth", colourHex: "#B8623F",
    finish: "Matt", coverage: "12–14 m² per litre per coat", stockQuantity: 9, isFeatured: false,
    shortDescription: "Warm terracotta inspired by laterite soil and clay pots.",
    description: VELVET_MATT_DESC,
  }),
  product({
    id: id(7), name: "Washable Matt Interior Emulsion", slug: "washable-matt-charcoal-night-4l",
    category: "interior", price: 22500, size: "4 L", colourName: "Charcoal Night", colourHex: "#2E2E33",
    finish: "Matt", coverage: "12–14 m² per litre per coat", stockQuantity: 4, isFeatured: false,
    shortDescription: "Dramatic near-black with a scrub-resistant matt finish.",
    description:
      "Our most durable matt. Built for high-traffic spaces and dramatic feature walls, this emulsion withstands repeated scrubbing without burnishing, so dark colours stay uniform for years.",
  }),

  // ---------------------------------------------------------------- exterior
  product({
    id: id(8), name: "WeatherShield Exterior Emulsion", slug: "weathershield-pure-white-20l",
    category: "exterior", price: 96000, size: "20 L", colourName: "Pure White", colourHex: "#F7F6F2",
    finish: "Smooth matt", coverage: "10–12 m² per litre per coat", stockQuantity: 12, isFeatured: true,
    shortDescription: "UV-stable, algae-resistant exterior white in a contractor pack.",
    description: WEATHERSHIELD_DESC,
  }),
  product({
    id: id(9), name: "WeatherShield Exterior Emulsion", slug: "weathershield-sandstone-4l",
    category: "exterior", price: 24000, size: "4 L", colourName: "Sandstone", colourHex: "#D4C4A8",
    finish: "Smooth matt", coverage: "10–12 m² per litre per coat", stockQuantity: 27, isFeatured: false,
    shortDescription: "Warm neutral that flatters both modern and colonial façades.",
    description: WEATHERSHIELD_DESC,
  }),
  product({
    id: id(10), name: "WeatherShield Exterior Emulsion", slug: "weathershield-slate-grey-4l",
    category: "exterior", price: 24000, size: "4 L", colourName: "Slate Grey", colourHex: "#6E7178",
    finish: "Smooth matt", coverage: "10–12 m² per litre per coat", stockQuantity: 18, isFeatured: false,
    shortDescription: "Architectural grey for contemporary exteriors and boundary walls.",
    description: WEATHERSHIELD_DESC,
  }),
  product({
    id: id(11), name: "Elastomeric Exterior Coating", slug: "elastomeric-exterior-pure-white-20l",
    category: "exterior", price: 145000, size: "20 L", colourName: "Pure White", colourHex: "#F7F6F2",
    finish: "Low sheen", coverage: "4–6 m² per litre per coat", stockQuantity: 6, isFeatured: false,
    shortDescription: "Flexible, waterproofing membrane paint that bridges hairline cracks.",
    description:
      "A thick, highly flexible acrylic coating that stretches with the building and seals hairline cracks against driving rain. Recommended for parapets, exposed elevations and older rendered walls.",
  }),

  // ---------------------------------------------------------------- ceiling
  product({
    id: id(12), name: "Ceiling White Flat Emulsion", slug: "ceiling-white-flat-20l",
    category: "ceiling", price: 58000, size: "20 L", colourName: "Ceiling White", colourHex: "#FBFBF9",
    finish: "Dead flat", coverage: "12–14 m² per litre per coat", stockQuantity: 20, isFeatured: false,
    shortDescription: "Non-reflective, splatter-resistant ceiling white.",
    description:
      "A dead-flat ceiling emulsion that hides roller marks and surface irregularities. Low-splatter formulation keeps floors clean and the bright white brightens rooms without glare.",
  }),
  product({
    id: id(13), name: "Ceiling White Flat Emulsion", slug: "ceiling-white-flat-4l",
    category: "ceiling", price: 13500, size: "4 L", colourName: "Ceiling White", colourHex: "#FBFBF9",
    finish: "Dead flat", coverage: "12–14 m² per litre per coat", stockQuantity: 40, isFeatured: false,
    shortDescription: "Non-reflective ceiling white for single rooms.",
    description:
      "A dead-flat ceiling emulsion that hides roller marks and surface irregularities. Low-splatter formulation keeps floors clean and the bright white brightens rooms without glare.",
  }),

  // ---------------------------------------------------------------- primer
  product({
    id: id(14), name: "Universal Wall Primer & Sealer", slug: "universal-wall-primer-4l",
    category: "primer", price: 14000, size: "4 L", colourName: null, colourHex: null,
    finish: "Matt", coverage: "10–12 m² per litre per coat", stockQuantity: 55, isFeatured: true,
    shortDescription: "Seals new plaster and old paint for an even, long-lasting topcoat.",
    description:
      "A water-based primer-sealer that binds dusty surfaces, evens out porosity and improves topcoat adhesion. One coat before any PrimeCoat emulsion means truer colour and fewer finishing coats.",
  }),
  product({
    id: id(15), name: "Alkali-Resisting Primer", slug: "alkali-resisting-primer-20l",
    category: "primer", price: 62000, size: "20 L", colourName: null, colourHex: null,
    finish: "Matt", coverage: "9–11 m² per litre per coat", stockQuantity: 10, isFeatured: false,
    shortDescription: "Protects topcoats from alkaline attack on fresh cement render.",
    description:
      "Essential on new cement render, concrete and block work. This solvent-free primer blocks alkali salts that would otherwise cause saponification, blistering and colour fade.",
  }),
  product({
    id: id(16), name: "Wood & Metal Primer", slug: "wood-metal-primer-grey-1l",
    category: "primer", price: 7800, size: "1 L", colourName: "Primer Grey", colourHex: "#9C9EA3",
    finish: "Matt", coverage: "12–14 m² per litre per coat", stockQuantity: 36, isFeatured: false,
    shortDescription: "Fast-drying undercoat for doors, frames, gates and railings.",
    description:
      "A quick-drying primer-undercoat for bare and previously painted timber and ferrous metal. Provides a uniform grey base for gloss and satin enamels.",
  }),

  // ---------------------------------------------------------------- gloss
  product({
    id: id(17), name: "Premium High Gloss Enamel", slug: "high-gloss-brilliant-white-4l",
    category: "gloss", price: 26500, size: "4 L", colourName: "Brilliant White", colourHex: "#FFFFFF",
    finish: "High gloss", coverage: "14–16 m² per litre per coat", stockQuantity: 25, isFeatured: true,
    shortDescription: "Mirror-like, non-yellowing gloss for doors, trims and furniture.",
    description:
      "A hard-wearing solvent-based enamel with brilliant flow and levelling. Dries to a mirror finish that resists chipping and yellowing. Ideal for doors, window frames, skirtings and metalwork.",
  }),
  product({
    id: id(18), name: "Premium High Gloss Enamel", slug: "high-gloss-signal-red-1l",
    category: "gloss", price: 8200, size: "1 L", colourName: "Signal Red", colourHex: "#C8322B",
    finish: "High gloss", coverage: "14–16 m² per litre per coat", stockQuantity: 12, isFeatured: false,
    shortDescription: "Vivid, durable red for gates, doors and accents.",
    description:
      "A hard-wearing solvent-based enamel with brilliant flow and levelling. Dries to a mirror finish that resists chipping and yellowing.",
  }),
  product({
    id: id(19), name: "Satin Enamel", slug: "satin-enamel-jet-black-1l",
    category: "gloss", price: 8200, size: "1 L", colourName: "Jet Black", colourHex: "#111113",
    finish: "Satin", coverage: "14–16 m² per litre per coat", stockQuantity: 0, isFeatured: false,
    shortDescription: "Soft-sheen black for railings, frames and furniture.",
    description:
      "A tough satin-finish enamel that hides brush marks and surface wear better than full gloss. Excellent on balustrades, window grilles and furniture.",
  }),

  // ---------------------------------------------------------------- textured
  product({
    id: id(20), name: "Stucco Textured Wall Finish", slug: "stucco-textured-natural-sand-20kg",
    category: "textured", price: 68000, size: "20 kg", colourName: "Natural Sand", colourHex: "#D8CBB4",
    finish: "Textured", coverage: "1.5–2 kg per m²", stockQuantity: 8, isFeatured: false,
    shortDescription: "Trowel-applied decorative finish for feature and exterior walls.",
    description:
      "A ready-mixed acrylic texture coating that can be trowelled, combed or stippled into a range of decorative patterns. Weather-resistant and ideal for pillars, fences and accent walls.",
  }),
  product({
    id: id(21), name: "Fine Textured Coat", slug: "fine-textured-coat-pebble-4l",
    category: "textured", price: 19000, size: "4 L", colourName: "Pebble", colourHex: "#BEB7AA",
    finish: "Fine texture", coverage: "4–6 m² per litre", stockQuantity: 15, isFeatured: false,
    shortDescription: "Roller-applied fine texture that disguises uneven plaster.",
    description:
      "A sand-filled emulsion that rolls on like paint but cures to a subtle, uniform texture. Perfect for hiding patched or uneven walls without full re-plastering.",
  }),

  // ---------------------------------------------------------------- wood finish
  product({
    id: id(22), name: "Clear Polyurethane Varnish", slug: "clear-polyurethane-varnish-satin-1l",
    category: "wood_finish", price: 9500, size: "1 L", colourName: "Clear", colourHex: null,
    finish: "Satin", coverage: "14–16 m² per litre per coat", stockQuantity: 28, isFeatured: false,
    shortDescription: "Protective satin clear coat for doors, floors and furniture.",
    description:
      "A tough, non-yellowing polyurethane varnish that protects timber from moisture, scratches and daily wear while letting the grain show through.",
  }),
  product({
    id: id(23), name: "Interior Wood Stain", slug: "wood-stain-dark-mahogany-1l",
    category: "wood_finish", price: 8900, size: "1 L", colourName: "Dark Mahogany", colourHex: "#5C2E22",
    finish: "Penetrating stain", coverage: "16–18 m² per litre", stockQuantity: 19, isFeatured: false,
    shortDescription: "Rich, even colour for doors, panelling and furniture.",
    description:
      "A penetrating, fade-resistant stain that colours timber evenly without masking the grain. Finish with Clear Polyurethane Varnish for protection.",
  }),

  // ---------------------------------------------------------------- metal finish
  product({
    id: id(24), name: "Anti-Rust Metal Enamel", slug: "anti-rust-metal-enamel-graphite-1l",
    category: "metal_finish", price: 9800, size: "1 L", colourName: "Graphite", colourHex: "#45484D",
    finish: "Satin", coverage: "12–14 m² per litre per coat", stockQuantity: 24, isFeatured: false,
    shortDescription: "Direct-to-metal protection for gates, railings and tanks.",
    description:
      "A rust-inhibiting enamel that can be applied directly to sound or lightly rusted steel without a separate primer. Weatherproof and resistant to chipping.",
  }),

  // ---------------------------------------------------------------- accessories
  product({
    id: id(25), name: "Painter's Masking Tape", slug: "painters-masking-tape-48mm",
    category: "accessories", price: 2400, size: "48 mm × 50 m", colourName: null, colourHex: null,
    finish: null, coverage: null, stockQuantity: 120, isFeatured: false,
    shortDescription: "Clean-release tape for sharp lines on walls and trims.",
    description:
      "A medium-tack crepe tape that holds firmly for up to 7 days and removes cleanly without residue or paint lift.",
  }),
  product({
    id: id(26), name: "Sandpaper Assortment Pack", slug: "sandpaper-assortment-pack",
    category: "accessories", price: 3200, size: "10 sheets", colourName: null, colourHex: null,
    finish: null, coverage: null, stockQuantity: 75, isFeatured: false,
    shortDescription: "Mixed 80–240 grit sheets for preparation and between-coat sanding.",
    description:
      "Ten aluminium-oxide sheets across 80, 120, 180 and 240 grit for stripping, keying and finishing. Cuts quickly and resists clogging.",
  }),
  product({
    id: id(27), name: "Paint Tray with Liner", slug: "paint-tray-with-liner-230mm",
    category: "accessories", price: 4500, size: "230 mm", colourName: null, colourHex: null,
    finish: null, coverage: null, stockQuantity: 42, isFeatured: false,
    shortDescription: "Deep-well tray with a disposable liner for fast colour changes.",
    description:
      "A rigid polypropylene tray with a ribbed loading ramp and a disposable liner, sized for 230 mm rollers.",
  }),
  product({
    id: id(28), name: "Cotton Drop Cloth", slug: "cotton-drop-cloth-3-6x2-7m",
    category: "accessories", price: 6800, size: "3.6 × 2.7 m", colourName: null, colourHex: null,
    finish: null, coverage: null, stockQuantity: 30, isFeatured: false,
    shortDescription: "Heavy canvas floor protection that stays put and absorbs drips.",
    description:
      "A reusable 8 oz cotton canvas drop cloth. Unlike plastic sheeting it does not slip or pool paint, and it folds away for the next job.",
  }),

  // ---------------------------------------------------------------- tools
  product({
    id: id(29), name: "Microfibre Roller Sleeve", slug: "microfibre-roller-sleeve-230mm-2pk",
    category: "tools", price: 5600, size: "230 mm · 2-pack", colourName: null, colourHex: null,
    finish: null, coverage: null, stockQuantity: 64, isFeatured: true,
    shortDescription: "Lint-free sleeves for a smooth, even emulsion finish.",
    description:
      "Twelve-millimetre-pile microfibre sleeves that hold more paint, release it evenly and leave no lint. Suitable for all PrimeCoat emulsions on smooth to lightly textured walls.",
  }),
  product({
    id: id(30), name: "Roller Frame & Extension Pole Set", slug: "roller-frame-extension-pole-set",
    category: "tools", price: 12500, size: "230 mm frame · 1.2–2.4 m pole", colourName: null, colourHex: null,
    finish: null, coverage: null, stockQuantity: 18, isFeatured: false,
    shortDescription: "Reach ceilings and high walls without a ladder.",
    description:
      "A heavy-duty 230 mm cage frame with a twist-lock aluminium pole extending from 1.2 to 2.4 metres. Fits all standard roller sleeves.",
  }),
  product({
    id: id(31), name: "Professional Brush Set", slug: "professional-brush-set-3pc",
    category: "tools", price: 9900, size: "25 / 50 / 75 mm", colourName: null, colourHex: null,
    finish: null, coverage: null, stockQuantity: 3, isFeatured: false,
    shortDescription: "Three synthetic-bristle brushes for cutting-in and trim work.",
    description:
      "Tapered synthetic filaments that hold a sharp edge for cutting in and release paint smoothly with both water- and solvent-based coatings. Beech handles, stainless ferrules.",
  }),
  product({
    id: id(32), name: "Paint Mixer Drill Attachment", slug: "paint-mixer-drill-attachment",
    category: "tools", price: 7500, size: "Fits 10 mm chuck", colourName: null, colourHex: null,
    finish: null, coverage: null, stockQuantity: 0, isFeatured: false,
    shortDescription: "Blends 20 L drums to a uniform colour in under a minute.",
    description:
      "A zinc-plated helical mixing paddle for cordless or corded drills. Ensures pigments are fully dispersed before application so colour is consistent from first wall to last.",
  }),
];

export const CATEGORY_ORDER: ProductCategory[] = [
  "interior", "exterior", "ceiling", "primer", "gloss", "textured",
  "wood_finish", "metal_finish", "accessories", "tools",
];
