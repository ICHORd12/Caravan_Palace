/*

import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
// Assuming you are using expo-font or similar for fonts
// import { useFonts } from 'expo-font'; 

const MyScreen = () => {
  // 1. Setup your states
  const [products, setProducts] = useState([]); // This will be my caravan.
  const [isProductLoaded, setIsProductLoaded] = useState(false); // This will the flag
  
  // Mocking font loaded state (replace with your actual font hook)
  const [fontsLoaded] = useFonts({ 'MyCustomFont': require('./assets/fonts/font.ttf') });

  // 2. Fetch data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // 'isActive' prevents state updates if the user navigates away before the fetch finishes
      let isActive = true; 

      const fetchProducts = async () => {
        setIsProductLoaded(false); // Reset loading state when entering page
        
        try {
          const response = await api.get('/products'); // Your backend call
          
          if (isActive) {
            setProducts(response.data);
            setIsProductLoaded(true); // Mark products as ready
          }
        } catch (error) {
          console.error("Failed to fetch products:", error);
          if (isActive) setIsProductLoaded(true); // Still mark ready to prevent infinite loading screens
        }
      };

      fetchProducts();

      // Cleanup function runs when the screen loses focus
      return () => {
        isActive = false; 
      };
    }, []) // Empty array ensures this callback is only created once
  );

  // 3. Trigger the animation when both conditions are met
  useEffect(() => {
    // Only run if BOTH fonts and products are ready
    if (fontsLoaded && isProductLoaded) {
      revealWipe();
    }
  }, [fontsLoaded, isProductLoaded]); // Re-evaluate when either state changes

  const revealWipe = () => {
    console.log("Animation triggered!");
    // Your animation logic here
  };

  // Render logic...
  if (!fontsLoaded || !isProductLoaded) {
    return <LoadingScreen />; // Show nothing or a loader until ready
  }

  return (
    <View>
       {Your Page Content}
    </View>
  );
};

export default MyScreen;

*/