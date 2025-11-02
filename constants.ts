
export const PIPELINE_STEPS = [
  {
    name: 'Fetch Configuration',
    description: 'Loading topics and settings from repository.',
  },
  {
    name: 'Gather News Articles',
    description: 'Fetching articles from Google News RSS feeds.',
  },
  {
    name: 'Intelligent Article Processing',
    description: 'Deduplicating and balancing articles by perspective.',
  },
  {
    name: 'AI Summarization',
    description: 'Generating summary with Gemini API.',
  },
  {
    name: 'Generate Content',
    description: 'Creating Markdown file for the static site.',
  },
  {
    name: 'Publish to GitHub',
    description: 'Committing new summary to repository.',
  },
  {
    name: 'Deploy & Cache Invalidation',
    description: 'Triggering site rebuild and clearing cache.',
  },
];
