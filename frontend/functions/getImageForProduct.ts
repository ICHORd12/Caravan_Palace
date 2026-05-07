const ProductImages = [
    require('@/assets/images/Caravann.jpg'),
    require('@/assets/images/Caravann2.jpg'),
    require('@/assets/images/Caravann3.jpg'),
    require('@/assets/images/Caravann4.jpg'),
    require('@/assets/images/Caravann5.jpg'),
    require('@/assets/images/Caravann6.jpg'),
    require('@/assets/images/Caravann7.jpg'),
    require('@/assets/images/Caravann8.jpg')
];

export default function getImageForProduct(productId: string) {
    if (!productId) return ProductImages[0];
    
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
        hash = productId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const index = Math.abs(hash) % ProductImages.length;
    return ProductImages[index];
}
