// Unsplash API Configuration
export const UNSPLASH_CONFIG = {
  ACCESS_KEY: process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY || 'OrrFQP6WXrreTKT2IqpuPmyrfVCfTJXWy1Lljh3Xxj0',
  BASE_URL: 'https://api.unsplash.com',
};

// Unsplash API fonksiyonları
export const unsplashAPI = {
  // Tarif adına göre resim arama
  searchRecipeImage: async (recipeName) => {
    try {
      const response = await fetch(
        `${UNSPLASH_CONFIG.BASE_URL}/search/photos?query=${encodeURIComponent(recipeName)}&per_page=1&orientation=landscape`,
        {
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_CONFIG.ACCESS_KEY}`,
          },
        }
      );

      const data = await response.json();
      console.log('UNSPLASH FULL RESPONSE:', JSON.stringify(data, null, 2));

      if (data.results && data.results.length > 0) {
        return {
          url: data.results[0].urls.regular,
          alt: data.results[0].alt_description || recipeName,
          photographer: data.results[0].user.name,
          photographerUrl: data.results[0].user.links.html,
        };
      }

      return null;
    } catch (error) {
      console.error('Unsplash API Error:', error);
      return null;
    }
  },
}; 