export function getProductImage(imageUrl?: string) {
  if (!imageUrl) return require('../assets/images/caravan.jpg');

  switch (imageUrl) {
    case 'voyager_x500':
      return require('../assets/images/caravan1.jpg');
    case 'nomadlux_300':
      return require('../assets/images/caravan2.jpg');
    case 'explorer_pro_700':
      return require('../assets/images/carcamp1.jpg');
    case 'trailmaster_450':
    case 'familyglide_600':
    case 'compacttrail_200':
    case 'luxtrail_800':
      return require('../assets/images/camp1.jpg');
    case 'solar_panel_kit':
    case 'caravan_awning':
    case 'portable_bbq':
    case 'water_purifier':
    case 'camping_chairs':
    case 'led_lanterns':
    case 'sleeping_bag':
      return require('../assets/images/accessory1.jpg');
    default:
      return require('../assets/images/caravan.jpg');
  }
}

export function getCategoryImage(categoryId: number) {
  switch (categoryId) {
    case 1: return require('../assets/images/caravan2.jpg'); // Motorhomes
    case 2: return require('../assets/images/camp1.jpg'); // Caravan Trailers
    case 3: return require('../assets/images/accessory1.jpg'); // Accessories
    case 4: return require('../assets/images/carcamp1.jpg'); // Outdoor Gear
    default: return require('../assets/images/caravan.jpg');
  }
}
