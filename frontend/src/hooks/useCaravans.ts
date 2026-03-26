import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import type { CaravanProduct } from '../components/ProductCard';

export function useCaravans() {
  const [caravans, setCaravans] = useState<CaravanProduct[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCaravans() {
      try {
        // We target the exact table name from the SQL schema
        const { data, error } = await supabase
          .from('products') 
          .select(`
            *,
            categories (category_name),
            product_images (url, is_primary),
            reviews (rating, is_approved)
          `);
        if (error) {
          throw error;
        }

        if (data) {
            const mappedCaravans: CaravanProduct[] = data.map((item: any) => {
              // Find the primary image, or use the first one available, or use a placeholder
              const primaryImage = item.product_images?.find((img: any) => img.is_primary);
              const fallbackImage = item.product_images?.[0]?.url;
              const finalImageUrl = primaryImage?.url || fallbackImage || 'https://via.placeholder.com/300x200?text=No+Image+Available';

              //review calculation
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
                reviewCount: reviewCount
              };
            });

          setCaravans(mappedCaravans);
        }
      } catch (err: any) {
        console.error("Supabase fetching error:", err.message);
        setError("Could not load inventory from the database.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCaravans();
  }, []);

  return { caravans, isLoading, error };
}