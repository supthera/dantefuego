/**
 * Manual products catalog (non-Printify).
 *
 * Workflow: add an entry → commit → push → live on dantefuegodev.
 * Set published: true to show on the site. Use id prefix "manual-".
 *
 * Copy-paste template:
 *
 * {
 *   id: 'manual-limited-hat',
 *   published: true,
 *   title: 'Limited Run Hat',
 *   description: 'Short description for the product page.',
 *   images: [
 *     {
 *       src: '/assets/manual-limited-hat.jpg',
 *       is_default: true,
 *       position: 'front'
 *     }
 *   ],
 *   options: [
 *     { type: 'color', values: [{ title: 'Black' }] },
 *     { type: 'size', values: [{ title: 'One Size' }] }
 *   ],
 *   variants: [
 *     {
 *       id: 'default',
 *       price: 4500,
 *       title: 'Black / One Size',
 *       is_enabled: true,
 *       options: [0, 0]
 *     }
 *   ]
 * }
 *
 * Images: 3:4 portrait, 1200×1600 px recommended. See docs/manual-fulfillment.md.
 * Do not duplicate Printify products here — use Printify + site-live tag for those.
 */

const converseImages = [
  { src: '/assets/df-x-converse/1.png', is_default: true, position: 'front' },
  { src: '/assets/df-x-converse/2.png', position: 'side' },
  { src: '/assets/df-x-converse/3.png', position: 'detail' },
  { src: '/assets/df-x-converse/4.png', position: 'profile' },
  { src: '/assets/df-x-converse/5.png', position: 'alternate' }
];

const converse2Images = [
  { src: '/assets/df-x-converse-2/5.png', is_default: true, position: 'front' },
  { src: '/assets/df-x-converse-2/1.png', position: 'alternate' },
  { src: '/assets/df-x-converse-2/2.png', position: 'side' },
  { src: '/assets/df-x-converse-2/3.png', position: 'profile' },
  { src: '/assets/df-x-converse-2/4.png', position: 'detail' }
];

const converseSizes = [
  "Men's 3 / Women's 5",
  "Men's 3.5 / Women's 5.5",
  "Men's 4 / Women's 6",
  "Men's 4.5 / Women's 6.5",
  "Men's 5 / Women's 7",
  "Men's 5.5 / Women's 7.5",
  "Men's 6 / Women's 8",
  "Men's 6.5 / Women's 8.5",
  "Men's 7 / Women's 9",
  "Men's 7.5 / Women's 9.5",
  "Men's 8 / Women's 10",
  "Men's 8.5 / Women's 10.5",
  "Men's 9 / Women's 11",
  "Men's 9.5 / Women's 11.5",
  "Men's 10 / Women's 12",
  "Men's 10.5 / Women's 12.5",
  "Men's 11 / Women's 13",
  "Men's 11.5 / Women's 13.5",
  "Men's 12 / Women's 14",
  "Men's 13 / Women's 15",
  "Men's 14 / Women's 16",
  "Men's 15 / Women's 17",
  "Men's 16 / Women's 18"
];

const DEFAULT_CONVERSE_SIZE = "Men's 4 / Women's 6";

function converseVariantId(sizeLabel) {
  const match = sizeLabel.match(/Men's ([\d.]+)/);
  return match ? `m-${match[1].replace('.', '-')}` : `size-${sizeLabel.length}`;
}

function buildConverseVariants(colorTitle, price) {
  return converseSizes.map((size, index) => ({
    id: converseVariantId(size),
    price,
    title: `${colorTitle} / ${size}`,
    is_enabled: true,
    is_default: size === DEFAULT_CONVERSE_SIZE,
    options: [0, index]
  }));
}

export default {
  products: [
    {
      id: 'manual-df-x-converse',
      published: true,
      title: 'DF x Converse BL-153 (Blood Leopard)',
      description:
        'Dante Fuego reworks the Chuck 70 as the BL-153: Blood Leopard.\nThe 1970s original gets its heavier 12oz canvas, glossy vulcanized sole, and OrthoLite insole — the build that outlasts standard All Stars once they\'ve collapsed into glorified slippers. Fuego\'s take brings that archive construction into bold territory: a split-tone leopard print upper and rugged sawtooth outsole are finished with metallic gold eyelets, a black inside lining, and a black denim heel stripe. Built to be worn.',
      sizeGuide: 'This style runs large. Order a half size down.',
      images: converseImages,
      options: [
        { type: 'color', values: [{ title: 'Blood Leopard' }] },
        { type: 'size', values: converseSizes.map((title) => ({ title })) }
      ],
      variants: buildConverseVariants('Blood Leopard', 15000)
    },
    {
      id: 'manual-df-x-converse-2',
      published: true,
      title: 'DF x Converse EZ-369 (Ebony Zebra)',
      description:
        'Custom Converse Chuck Taylor high-tops in ebony zebra canvas, silver eyelets, red DANTE FUEGO heel branding, and a black platform lug sole. Ships after manual procurement.',
      sizeGuide: 'This style runs large. Order a half size down.',
      images: converse2Images,
      options: [
        { type: 'color', values: [{ title: 'Ebony Zebra' }] },
        { type: 'size', values: converseSizes.map((title) => ({ title })) }
      ],
      variants: buildConverseVariants('Ebony Zebra', 13000)
    }
  ]
};
