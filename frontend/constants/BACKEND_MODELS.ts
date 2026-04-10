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


type CartProduct = {
    name: string,
    currentPrice: string,
    quantityInStocks: number 
}

export type CartItem = {
    cartItemId: string;
    userId: string;
    productId: string; 
    quantity: number;
    addedAt: string;
    product: CartProduct;
}

export type FetchProductDetailsResponse = {
    message: string,
    products: Caravan[]
}

type Adjustment = {
    productId: string,
    requestedQuantity: number,
    finalQuantity: number,
    reason: string
}

export type MergeBackendCartResponse = {
    message: string,
    items: CartItem[],
    adjustments: Adjustment[]
}


