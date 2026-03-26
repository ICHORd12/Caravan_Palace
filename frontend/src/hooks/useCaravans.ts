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
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          // Map the Supabase snake_case columns to our frontend camelCase interface
          const mappedCaravans: CaravanProduct[] = data.map((item: any) => ({
            id: item.product_id,                  // Maps to uuid
            name: item.name,
            model: item.model,
            serialNumber: item.serial_number,     // Fixes the mismatch
            description: item.description,
            quantityInStock: item.quantity_in_stocks, // Fixes the mismatch
            price: item.current_price,            // Using current_price instead of base_price
            warrantyStatus: item.warranty_status, // Fixes the mismatch
            distributorInfo: item.distributor_info // Fixes the mismatch
          }));

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