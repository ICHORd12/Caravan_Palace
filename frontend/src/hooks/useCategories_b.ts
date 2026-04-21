import { useState, useEffect } from 'react';

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
        // Change this URL to match your backend's category route
        const response = await fetch('http://localhost:8080/api/v1/categories');

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data) {
          const mappedCategories: Category[] = data.map((item: any) => ({
            id: item.category_id,
            name: item.category_name
          }));

          setCategories(mappedCategories);
        }
      } catch (err: any) {
        console.error("Backend fetching error:", err.message);
        setError("Could not load categories from the server.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}