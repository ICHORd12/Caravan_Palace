/*

These are the types that directly associated with the backend.   
Usually responses.       
                                        
*/

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
    updatedAt: string,
    images: any[]
}


export type CartProduct = {
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

export type FetchProductsAllResponse = {
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

export type GetBackendCartResponse = {
    message: string,
    items: CartItem[]
}

export type ReviewEligibility = {
    canReview: boolean,
    reason: string
}

export type UserReview = {
    reviewId: string,
    productId: string,
    userId: string,
    userName: string,
    rating: number,
    commentText: string,
    isApproved: false,
    createdAt: string,
    updatedAt: string
}

export type Review = {
    reviewId: string,
    productId: string,
    userId: string,
    userName: string,
    rating: number,
    commentText: string,
    isApproved: boolean,
    createdAt: string,
    updatedAt: string
}

export type GetProductIdDetailsResponse = {
    message: string,
    product: Caravan,
    reviewEligibility: ReviewEligibility,
    userReview: UserReview,
    reviews: Review[]
}



