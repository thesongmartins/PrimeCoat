/**
 * Photography placeholders (Unsplash CDN). Each entry was visually verified.
 * Replace with PrimeCoat's own photography by changing the URL — nothing else depends on the host.
 */
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop`;

export const IMAGES = {
  hero: {
    src: u("1615873968403-89e068629265"),
    alt: "Living room with a deep green painted feature wall, tan leather sofa and framed artwork",
  },
  heroSecondary: {
    src: u("1586023492125-27b2c045efd7"),
    alt: "Minimal living room with a mustard armchair against a soft white wall",
  },
  services: {
    src: u("1562259949-e8e7689d7828"),
    alt: "Paint roller applying a coat of blue paint to a white wall",
  },
  about: {
    src: u("1562663474-6cbb3eaa4d14"),
    alt: "Bright white painted wall with a tall plant and grey sofa",
  },
  projects: {
    livingGreen: {
      src: u("1615873968403-89e068629265"),
      alt: "Living room with a deep green feature wall",
    },
    livingWarm: {
      src: u("1618221195710-dd6b41faaea6"),
      alt: "Warm, open-plan living room with grey sofa and timber accents",
    },
    livingGallery: {
      src: u("1600210492486-724fe5c67fb0"),
      alt: "Sunlit living room with a gallery wall",
    },
    livingSage: {
      src: u("1554995207-c18c203602cb"),
      alt: "Open-plan living and kitchen with a sage green accent wall",
    },
    bedroomOrange: {
      src: u("1540518614846-7eded433c457"),
      alt: "Bedroom with warm grey walls and burnt orange accents",
    },
    bedroomMinimal: {
      src: u("1600573472591-ee6b68d14c68"),
      alt: "Minimal bedroom with crisp white walls and floor-to-ceiling glazing",
    },
    bedroomBlush: {
      src: u("1595428774223-ef52624120d2"),
      alt: "Blush pink painted wall with a timber storage unit",
    },
    officeDark: {
      src: u("1497366216548-37526070297c"),
      alt: "Modern office with deep navy painted walls",
    },
    officeGlass: {
      src: u("1497366754035-f200968a6e72"),
      alt: "Office corridor with glass partitions and polished floors",
    },
    exteriorDusk: {
      src: u("1600585154340-be6161a56a0c"),
      alt: "Contemporary house exterior with dark cladding at dusk",
    },
    exteriorWhite: {
      src: u("1600596542815-ffad4c1539a9"),
      alt: "White rendered villa exterior with a pool",
    },
    exteriorTimber: {
      src: u("1600566753190-17f0baa2a6c3"),
      alt: "Modern house exterior with timber and black painted cladding",
    },
    kitchen: {
      src: u("1588854337115-1c67d9247e4d"),
      alt: "White kitchen with freshly painted cabinetry",
    },
    bathroom: {
      src: u("1604709177225-055f99402ea3"),
      alt: "Grey bathroom with white sanitaryware",
    },
  },
} as const;
