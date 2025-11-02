export const NEWS_CONFIG = {
  topics: [
    {
      id: "venezuela",
      name: "Venezuela",
      active: true,
      rssFeeds: [
        {
          type: "google_news",
          language: "es",
          region: "VE",
          query: "Venezuela (militar OR sanciones OR oposición OR Maduro OR EEUU OR elección OR política OR protesta)",
          perspective: "venezuelan"
        },
        {
          type: "google_news",
          language: "en",
          region: "US",
          query: "Venezuela (US military OR sanctions OR opposition OR Maduro OR diplomatic OR policy OR election)",
          perspective: "us"
        }
      ]
    }
  ],
  settings: {
    maxArticlesPerTopic: 20,
    articleMaxAgeDays: 5,
    minArticlesPerFeed: 5,
    deduplicationSimilarityThreshold: 0.75
  }
};
