import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export interface Category {
  id: string;
  name: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        // Fetching directly from the 'categories' table
        const { data, error } = await supabase
          .from('categories')
          .select('*');

        if (error) {
          throw error;
        }

        if (data) {
          // Map the database columns to our frontend interface
          const mappedCategories: Category[] = data.map((item: any) => ({
            id: item.category_id,
            name: item.category_name
          }));

          setCategories(mappedCategories);
        }
      } catch (err: any) {
        console.error("Supabase fetching error:", err.message);
        setError("Could not load categories.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}