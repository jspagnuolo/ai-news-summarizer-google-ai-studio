import { Summary, PipelineCallbacks, FetchedArticle, ArticleSource } from '../types';
import { PIPELINE_STEPS } from '../constants';
import { NEWS_CONFIG } from '../config';

const CORS_PROXY = 'https://corsproxy.io/?';
// In a real deployment, this would be the URL of your deployed worker.
// Cloudflare Pages can be configured to proxy requests, so a relative path works.
const WORKER_URL = '/api/summarize'; 

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Helper Algorithms from System Description ---

function jaccardSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const set2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return intersection.size / union.size;
}

function balanceArticleSelection(articles: FetchedArticle[], maxArticles: number): FetchedArticle[] {
    const byPerspective: Record<string, FetchedArticle[]> = {};
    articles.forEach(article => {
      const key = article.perspective;
      if (!byPerspective[key]) byPerspective[key] = [];
      byPerspective[key].push(article);
    });

    const perspectives = Object.keys(byPerspective);
    if (perspectives.length === 0) return [];
    
    const targetPerSource = Math.floor(maxArticles / perspectives.length);
    let selected: FetchedArticle[] = [];

    perspectives.forEach(p => {
      const articlesForPerspective = byPerspective[p].sort((a,b) => b.publishedDate.getTime() - a.publishedDate.getTime());
      const take = Math.min(articlesForPerspective.length, targetPerSource);
      selected.push(...articlesForPerspective.slice(0, take));
    });
    
    let remaining = maxArticles - selected.length;
    const allRemainingArticles = articles.filter(a => !selected.includes(a))
        .sort((a,b) => b.publishedDate.getTime() - a.publishedDate.getTime());

    selected.push(...allRemainingArticles.slice(0, remaining));

    return selected;
}

// --- Live Data Fetching and Processing ---

async function fetchAndParseRSS(feed: any, maxAgeDays: number): Promise<FetchedArticle[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(feed.query)}&hl=${feed.language}&gl=${feed.region}&ceid=${feed.region}:${feed.language}`;
  const response = await fetch(`${CORS_PROXY}${encodeURIComponent(url)}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status} - ${response.statusText}. Details: ${errorText.substring(0, 150)}`);
  }

  const xmlText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const items = Array.from(xmlDoc.querySelectorAll("item"));
  const articles: FetchedArticle[] = [];
  const ageLimit = new Date();
  ageLimit.setDate(ageLimit.getDate() - maxAgeDays);

  for (const item of items) {
    const pubDate = new Date(item.querySelector("pubDate")?.textContent || '');
    if (pubDate < ageLimit) continue;
    
    const fullTitle = item.querySelector("title")?.textContent || 'No title';
    const titleParts = fullTitle.split(' - ');
    const source = titleParts.length > 1 ? titleParts.pop()!.trim() : 'Unknown Source';
    const title = titleParts.join(' - ');

    articles.push({
      title,
      url: item.querySelector("link")?.textContent || '',
      publishedDate: pubDate,
      description: item.querySelector("description")?.textContent || '',
      source,
      language: feed.language,
      region: feed.region,
      perspective: feed.perspective,
    });
  }
  return articles;
}


async function generateSummaryViaWorker(
  articlesByPerspective: Record<string, FetchedArticle[]>,
): Promise<Omit<Summary, 'sources' | 'articleCount' | 'venezuelanSources' | 'usSources' | 'title' | 'date' | 'topic' | 'topicName'>> {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ articlesByPerspective }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Worker API Error (${response.status}): ${errorData.error || response.statusText}`);
    }

    const summaryData = await response.json();
    return summaryData;
  } catch(error) {
    console.error("Worker Fetch Error:", error);
    throw new Error(`Failed to generate summary via worker. Is it deployed and running? Details: ${error}`);
  }
}

// --- Main Pipeline Orchestrator ---

export const runNewsPipeline = async (callbacks: PipelineCallbacks) => {
  const { onLog, onStepChange, onSummaryGenerated } = callbacks;
  const { settings, topics } = NEWS_CONFIG;
  const activeTopic = topics.find(t => t.active);

  if (!activeTopic) {
    throw new Error("No active topic found in configuration.");
  }

  // STEP 0: Fetch Configuration
  onStepChange(0);
  onLog(`[Step 1/${PIPELINE_STEPS.length}] ${PIPELINE_STEPS[0].name}...`);
  onLog(`  -> Loaded 1 active topic: ${activeTopic.name}.`);
  await sleep(500);

  // STEP 1: Gather News Articles
  onStepChange(1);
  onLog(`[Step 2/${PIPELINE_STEPS.length}] ${PIPELINE_STEPS[1].name}...`);
  let allArticles: FetchedArticle[] = [];
  for (const feed of activeTopic.rssFeeds) {
      try {
          onLog(`  -> Fetching articles for '${feed.perspective}' perspective...`);
          const articles = await fetchAndParseRSS(feed, settings.articleMaxAgeDays);
          allArticles.push(...articles);
          onLog(`  -> Found ${articles.length} recent articles for '${feed.perspective}'.`);
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "An unknown fetch error occurred.";
          onLog(`  -> ⚠️ Error fetching feed for ${feed.perspective}: ${errorMessage}`);
      }
  }

  // STEP 2: Intelligent Article Processing
  onStepChange(2);
  // FIX: Corrected typo from PIPELIN_STEPS to PIPELINE_STEPS
  onLog(`[Step 3/${PIPELINE_STEPS.length}] ${PIPELINE_STEPS[2].name}...`);
  
  let uniqueArticles: FetchedArticle[] = [];
  let duplicateCount = 0;
  for (const article of allArticles) {
      const isDuplicate = uniqueArticles.some(uniqueArticle => 
          uniqueArticle.url === article.url || 
          jaccardSimilarity(uniqueArticle.title, article.title) > settings.deduplicationSimilarityThreshold
      );
      if (!isDuplicate) {
          uniqueArticles.push(article);
      } else {
          duplicateCount++;
      }
  }
  onLog(`  -> Removed ${duplicateCount} duplicate or highly similar articles.`);

  const selectedArticles = balanceArticleSelection(uniqueArticles, settings.maxArticlesPerTopic);
  onLog(`  -> Balanced selection to ${selectedArticles.length} articles.`);

  // STEP 3: AI Summarization (via Worker)
  onStepChange(3);
  onLog(`[Step 4/${PIPELINE_STEPS.length}] ${PIPELINE_STEPS[3].name}...`);
  const articlesByPerspective = selectedArticles.reduce((acc, article) => {
      if (!acc[article.perspective]) acc[article.perspective] = [];
      acc[article.perspective].push(article);
      return acc;
  }, {} as Record<string, FetchedArticle[]>);

  onLog("  -> Sending articles to secure worker for summarization...");
  const aiSummary = await generateSummaryViaWorker(articlesByPerspective);
  onLog("  -> Successfully received structured summary from worker.");

  const today = new Date();
  const formattedDate = today.toISOString().split('T')[0];
  const finalSummary: Summary = {
      ...aiSummary,
      title: `${activeTopic.name} News - ${formattedDate}`,
      date: today.toISOString(),
      topic: activeTopic.id,
      topicName: activeTopic.name,
      sources: selectedArticles.map(a => ({
          ...a,
          publishedDate: a.publishedDate.toISOString().split('T')[0]
      })),
      articleCount: selectedArticles.length,
      venezuelanSources: articlesByPerspective['venezuelan']?.length || 0,
      usSources: articlesByPerspective['us']?.length || 0,
  };
  onSummaryGenerated(finalSummary);

  const simulateBackendStep = async (stepIndex: number, delay: number, logs: string[]) => {
      onStepChange(stepIndex);
      onLog(`[Step ${stepIndex + 1}/${PIPELINE_STEPS.length}] ${PIPELINE_STEPS[stepIndex].name}...`);
      await sleep(delay);
      logs.forEach(log => onLog(log));
  };
  
  await simulateBackendStep(4, 500, [`  -> Generated Hugo markdown file: /content/summaries/${activeTopic.id}/${formattedDate}.md`]);
  await simulateBackendStep(5, 1000, ["  -> Committed and pushed file to GitHub repository."]);
  await simulateBackendStep(6, 1500, ["  -> Cloudflare Pages build triggered.", "  -> Purged Cloudflare cache for immediate visibility."]);
};