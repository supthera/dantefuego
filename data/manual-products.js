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
  { src: '/assets/df-x-converse-2/1.png', is_default: true, position: 'front' },
  { src: '/assets/df-x-converse-2/2.png', position: 'side' },
  { src: '/assets/df-x-converse-2/3.png', position: 'profile' },
  { src: '/assets/df-x-converse-2/4.png', position: 'detail' },
  { src: '/assets/df-x-converse-2/5.png', position: 'alternate' }
];

const converseSizes = ['8', '9', '10', '11', '12'];

export default {
  products: [
    {
      id: 'manual-df-x-converse',
      published: true,
      title: 'DF x Converse BL-153 (Blood Leopard)',
      description:
        'Custom Converse Chuck Taylor high-tops with blood leopard canvas, gold eyelets, Dante Fuego heel branding, and a platform lug sole. Ships after manual procurement.',
      images: converseImages,
      options: [
        { type: 'color', values: [{ title: 'Blood Leopard' }] },
        { type: 'size', values: converseSizes.map((title) => ({ title: `US ${title}` })) }
      ],
      variants: converseSizes.map((size, index) => ({
        id: `us-${size}`,
        price: 15000,
        title: `Blood Leopard / US ${size}`,
        is_enabled: true,
        is_default: size === '10',
        options: [0, index]
      }))
    },
    {
      id: 'manual-df-x-converse-2',
      published: true,
      title: 'DF x Converse II',
      description:
        'Custom Converse Chuck Taylor high-tops in black canvas with tiger-stripe panels, silver eyelets, red DANTE FUEGO heel branding, and a black platform lug sole. Ships after manual procurement.',
      images: converse2Images,
      options: [
        { type: 'color', values: [{ title: 'Black Tiger' }] },
        { type: 'size', values: converseSizes.map((title) => ({ title: `US ${title}` })) }
      ],
      variants: converseSizes.map((size, index) => ({
        id: `us-${size}`,
        price: 15000,
        title: `Black Tiger / US ${size}`,
        is_enabled: true,
        is_default: size === '10',
        options: [0, index]
      }))
    }
  ]
};
