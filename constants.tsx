
import { MakeupCategory, Product } from './types';

// Export categories derived from the MakeupCategory enum for UI usage
export const CATEGORIES = Object.values(MakeupCategory);

export const PRODUCTS: Product[] = [
  // Foundations & Cover-ups
  { id: 'f-1', brand: 'Rare Beauty', category: MakeupCategory.FOUNDATION, name: 'Liquid Touch', color: '110N', hex: '#f9e6d4', finish: 'Natural', description: 'Weightless foundation.' },
  { id: 'f-2', brand: 'Rare Beauty', category: MakeupCategory.FOUNDATION, name: 'Liquid Touch', color: '210N', hex: '#e8c0a0', finish: 'Natural', description: 'Medium neutral.' },
  { id: 'f-3', brand: 'NARS', category: MakeupCategory.FOUNDATION, name: 'Sheer Glow', color: 'Mont Blanc', hex: '#f7dfce', finish: 'Dewy', description: 'Brightening foundation.' },
  { id: 'f-4', brand: 'NARS', category: MakeupCategory.FOUNDATION, name: 'Sheer Glow', color: 'Syracuse', hex: '#c58d59', finish: 'Dewy', description: 'Warm tan.' },
  { id: 'f-5', brand: 'MAC', category: MakeupCategory.FOUNDATION, name: 'Studio Fix', color: 'NW15', hex: '#f5d9c1', finish: 'Matte', description: 'Full coverage.' },
  { id: 'f-6', brand: 'MAC', category: MakeupCategory.FOUNDATION, name: 'Studio Fix', color: 'NW45', hex: '#633e2a', finish: 'Matte', description: 'Deep warm.' },
  { id: 'f-7', brand: 'Estée Lauder', category: MakeupCategory.FOUNDATION, name: 'Double Wear', color: '1N1 Ivory Nude', hex: '#f6dcc1', finish: 'Matte', description: 'Stay-in-place foundation.' },
  { id: 'f-8', brand: 'Estée Lauder', category: MakeupCategory.FOUNDATION, name: 'Double Wear', color: '4W1 Honey Bronze', hex: '#bd8b5f', finish: 'Matte', description: 'Long-wear full coverage.' },

  // Lipsticks - Significantly expanded
  { id: 'l-1', brand: 'Charlotte Tilbury', category: MakeupCategory.LIPSTICK, name: 'Matte Revolution', color: 'Pillow Talk', hex: '#dcae96', finish: 'Matte', description: 'The cult classic pink.' },
  { id: 'l-2', brand: 'Charlotte Tilbury', category: MakeupCategory.LIPSTICK, name: 'Matte Revolution', color: 'Walk of No Shame', hex: '#954b4d', finish: 'Matte', description: 'Berry rose.' },
  { id: 'l-3', brand: 'Dior', category: MakeupCategory.LIPSTICK, name: 'Rouge Dior', color: '999 Velvet', hex: '#bc1e22', finish: 'Satin', description: 'Iconic red.' },
  { id: 'l-4', brand: 'Chanel', category: MakeupCategory.LIPSTICK, name: 'Rouge Allure', color: 'Pirate', hex: '#8a0a14', finish: 'Satin', description: 'Timeless deep red.' },
  { id: 'l-5', brand: 'Fenty', category: MakeupCategory.LIPSTICK, name: 'Stunna Lip Paint', color: 'Uncensored', hex: '#c60c30', finish: 'Matte', description: 'Universal red.' },
  { id: 'l-6', brand: 'MAC', category: MakeupCategory.LIPSTICK, name: 'Retro Matte', color: 'Ruby Woo', hex: '#ba0020', finish: 'Matte', description: 'Vivid blue-red.' },
  { id: 'l-7', brand: 'MAC', category: MakeupCategory.LIPSTICK, name: 'Matte Lipstick', color: 'Velvet Teddy', hex: '#b37f6a', finish: 'Matte', description: 'Deep-tone beige.' },
  { id: 'l-8', brand: 'MAC', category: MakeupCategory.LIPSTICK, name: 'Amplified', color: 'Girl About Town', hex: '#d12d6e', finish: 'Satin', description: 'Bright blue-fuchsia.' },
  { id: 'l-9', brand: 'Rare Beauty', category: MakeupCategory.LIPSTICK, name: 'Lip Soufflé', color: 'Inspire', hex: '#e34d3d', finish: 'Matte', description: 'Bright red orange.' },
  { id: 'l-10', brand: 'Rare Beauty', category: MakeupCategory.LIPSTICK, name: 'Lip Soufflé', color: 'Fearless', hex: '#844d4d', finish: 'Matte', description: 'Deep mauve rose.' },
  { id: 'l-11', brand: 'Maybelline', category: MakeupCategory.LIPSTICK, name: 'SuperStay Vinyl Ink', color: 'Coy', hex: '#b56d81', finish: 'Glossy', description: 'Long-wear pink mauve.' },
  { id: 'l-12', brand: 'Maybelline', category: MakeupCategory.LIPSTICK, name: 'SuperStay Vinyl Ink', color: 'Red-Hot', hex: '#c41e1e', finish: 'Glossy', description: 'Bright saturated red.' },
  { id: 'l-13', brand: 'YSL', category: MakeupCategory.LIPSTICK, name: 'Rouge Volupté', color: 'Nude Lavallière', hex: '#d9978b', finish: 'Glossy', description: 'Shine oil-in-stick.' },
  { id: 'l-14', brand: 'YSL', category: MakeupCategory.LIPSTICK, name: 'Rouge Pur Couture', color: 'Le Rouge', hex: '#b51111', finish: 'Satin', description: 'The quintessential red.' },
  { id: 'l-15', brand: 'NARS', category: MakeupCategory.LIPSTICK, name: 'Powermatte', color: 'Dragon Girl', hex: '#bd132a', finish: 'Matte', description: 'Vivid siren red.' },
  { id: 'l-16', brand: 'NARS', category: MakeupCategory.LIPSTICK, name: 'Powermatte', color: 'American Woman', hex: '#a66e6e', finish: 'Matte', description: 'Chestnut rose.' },
  { id: 'l-17', brand: 'Pat McGrath', category: MakeupCategory.LIPSTICK, name: 'MatteTrance', color: 'Flesh 3', hex: '#7a3b3b', finish: 'Matte', description: 'Deep bronzed rose.' },
  { id: 'l-18', brand: 'Pat McGrath', category: MakeupCategory.LIPSTICK, name: 'MatteTrance', color: 'Elson', hex: '#9e1414', finish: 'Matte', description: 'Blue-red perfection.' },
  { id: 'l-19', brand: 'Sephora Collection', category: MakeupCategory.LIPSTICK, name: 'Cream Lip Stain', color: 'Always Red', hex: '#b00000', finish: 'Matte', description: 'Classic true red.' },
  { id: 'l-20', brand: 'Sephora Collection', category: MakeupCategory.LIPSTICK, name: 'Cream Lip Stain', color: 'Marvelous Mauve', hex: '#9c6b73', finish: 'Matte', description: 'Dusty rose mauve.' },

  // Blush
  { id: 'b-1', brand: 'Glossier', category: MakeupCategory.BLUSH, name: 'Cloud Paint', color: 'Puff', hex: '#f3c7c4', finish: 'Matte', description: 'Baby pink.' },
  { id: 'b-2', brand: 'Glossier', category: MakeupCategory.BLUSH, name: 'Cloud Paint', color: 'Storm', hex: '#8b4b4b', finish: 'Matte', description: 'Dried rose.' },
  { id: 'b-3', brand: 'Rare Beauty', category: MakeupCategory.BLUSH, name: 'Soft Pinch', color: 'Hope', hex: '#e4a5a2', finish: 'Dewy', description: 'Nude mauve.' },
  { id: 'b-4', brand: 'NARS', category: MakeupCategory.BLUSH, name: 'Powder Blush', color: 'Orgasm', hex: '#f2a899', finish: 'Shimmer', description: 'Peachy pink with gold shimmer.' },

  // Eyes
  { id: 'e-1', brand: 'Urban Decay', category: MakeupCategory.EYESHADOW, name: 'Moondust', color: 'Space Cowboy', hex: '#d9c5b2', finish: 'Shimmer', description: 'Wet-look sparkle.' },
  { id: 'e-2', brand: 'Urban Decay', category: MakeupCategory.EYESHADOW, name: 'Moondust', color: 'Lithium', hex: '#4e433a', finish: 'Shimmer', description: 'Gunmetal taupe.' },
  { id: 'e-3', brand: 'Stila', category: MakeupCategory.EYELINER, name: 'Stay All Day', color: 'Intense Black', hex: '#000000', finish: 'Matte', description: 'Liquid waterproof liner.' },
  { id: 'e-4', brand: 'Stila', category: MakeupCategory.EYELINER, name: 'Stay All Day', color: 'Midnight Blue', hex: '#001b4d', finish: 'Matte', description: 'Deep navy liner.' },
];

export const COLOR_SPECTRUM = [
  '#FFB6C1', '#FF69B4', '#FF1493', '#DB7093', '#C71585', // Pinks
  '#FFA07A', '#FF7F50', '#FF6347', '#FF4500', '#FF0000', // Oranges/Reds
  '#800000', '#8B0000', '#A52A2A', '#B22222', '#DC143C', // Deeps
  '#E6E6FA', '#D8BFD8', '#DDA0DD', '#EE82EE', '#DA70D6', // Purples
  '#BA55D3', '#9932CC', '#9400D3', '#8A2BE2', '#4B0082', // Deep Purples
  '#F5F5DC', '#FFE4C4', '#FFDEAD', '#F5DEB3', '#DEB887', // Nudes
  '#D2B48C', '#BC8F8F', '#F4A460', '#DAA520', '#B8860B'  // Golds/Browns
];
