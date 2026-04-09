import { useState, useEffect } from 'react';
import type { CaravanProduct } from '../components/ProductCard';

export function useCaravans() {
  const [caravans, setCaravans] = useState<CaravanProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCaravans() {
      try {
        const response = await fetch('http://localhost:8080/api/v1/products/all');

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data) {
   
          const mappedCaravans: CaravanProduct[] = data.map((item: any) => {
            const primaryImage = item.product_images?.find((img: any) => img.is_primary);
            const fallbackImage = item.product_images?.[0]?.url;
            const finalImageUrl = primaryImage?.url || fallbackImage || 'src/assets/cannot_find.jpg';
           

            const approvedReviews = item.reviews?.filter((r: any) => r.is_approved) || [];
            const reviewCount = approvedReviews.length;
            const averageRating = reviewCount > 0 
              ? approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount 
              : 0;

            return {
              id: item.product_id,                  
              name: item.name,
              model: item.model,
              serialNumber: item.serial_number,     
              description: item.description,
              quantityInStock: item.quantity_in_stocks, 
              price: item.current_price,            
              warrantyStatus: item.warranty_status, 
              distributorInfo: item.distributor_info,
              category: item.categories?.category_name || 'Uncategorized',
              imageUrl: finalImageUrl,
              averageRating: averageRating,
              reviewCount: reviewCount,
              weightKg: item.weight_kg,
              hasKitchen: item.has_kitchen
            };
          });

          setCaravans(mappedCaravans);
        }
      } catch (err: any) {
        console.error("Backend fetching error:", err.message);
        setError("Could not load inventory from the server.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCaravans();
  }, []);

  return { caravans, isLoading, error };
}