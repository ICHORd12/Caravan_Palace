export type Caravan = {
    productId: string,
    categoryId: string,
    name: string,
    model: string,
    serialNumber: string,
    description: string,
    quantityInStocks: number,
    basePrice: string,
    currentPrice: string,
    discountRate: number,
    warrantyStatus: string,
    distributorInfo: string,
    berthCount: number,
    fuelType: string,
    weightKg: number,
    hasKitchen: boolean,
    createdAt: string,
    updatedAt: string
}


type cartProduct ={
    name: string,
    currentPrice: string,
    quantityInStocks: number // To Be Deleted Later In Backend
}

export type CartItem = {
    cartItemId: string;
    userId: string;
    productId: string; 
    quantity: number;
    addedAt: string;
    product: cartProduct;
}


