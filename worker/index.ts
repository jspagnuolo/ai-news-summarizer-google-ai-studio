import { GoogleGenAI, Type } from '@google/genai';
import { Router, IRequest } from 'itty-router';

// Define the shape of the incoming request body
interface SummarizeRequest extends IRequest {
  json: () => Promise<{ articlesByPerspective: Record<string, { title: string }[]> }>;
}

// Define the environment variables available to the worker
export interface Env {
  API_KEY: string;
}

const router = Router();

// Middleware to handle CORS preflight requests and add CORS headers
const withCORS = (request: IRequest, env: Env) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Attach headers to the response for the actual request
  return (response: Response) => {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  };
};

router.post('/api/summarize', async (request: SummarizeRequest, env: Env) => {
  try {
    const { articlesByPerspective } = await request.json();
    if (!articlesByPerspective) {
      return new Response(JSON.stringify({ error: 'Missing articlesByPerspective in request body' }), { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: env.API_KEY });

    const systemPrompt = `You are an expert news analyst. Your task is to synthesize information from two sets of news articles (US and Venezuelan sources) about Venezuela. Generate a balanced, neutral summary. Provide three distinct sections: overall highlights combining both views, a summary of the US perspective, and a summary of the Venezuelan perspective. Output must be in JSON format.`;

    const formatArticlesForPrompt = (articles: { title: string }[]) => {
      if (!articles || articles.length === 0) return "No articles provided.";
      return articles.map(a => `- ${a.title}`).join('\n');
    };
    
    const userPrompt = `
      Here are the titles of articles about Venezuela:

      --- US PERSPECTIVE ARTICLES ---
      ${formatArticlesForPrompt(articlesByPerspective['us'] || [])}

      --- VENEZUELAN PERSPECTIVE ARTICLES ---
      ${formatArticlesForPrompt(articlesByPerspective['venezuelan'] || [])}
      ---
      
      Please generate the comparative summary based on the topics covered in these article titles.
    `;
    
    const summarySchema = {
      type: Type.OBJECT,
      properties: {
        venezuelanPerspective: { type: Type.ARRAY, items: { type: Type.STRING } },
        usPerspective: { type: Type.ARRAY, items: { type: Type.STRING } },
        overallHighlights: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["venezuelanPerspective", "usPerspective", "overallHighlights"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: summarySchema,
        temperature: 0.3,
      },
    });

    const summaryData = JSON.parse(response.text);
    return new Response(JSON.stringify(summaryData), { headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error in worker:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: 'Failed to generate summary from AI.', details: errorMessage }), { status: 500 });
  }
});

// Catch-all for 404s
router.all('*', () => new Response('Not Found.', { status: 404 }));

export default {
  fetch: (request: IRequest, env: Env, ctx: any) => {
    const corsEnhancer = withCORS(request, env);
    if (corsEnhancer && !(corsEnhancer instanceof Function)) return corsEnhancer; // Handle OPTIONS preflight

    return router.handle(request, env, ctx).then(corsEnhancer as (response: Response) => Response);
  },
};
