import { GoogleGenAI } from '@google/genai';

function authorized(req: any) {
  const expected = process.env.DASHBOARD_PASSWORD;
  const auth = req?.headers?.authorization || '';
  return Boolean(expected && auth === `Bearer ${expected}`);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!authorized(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'GEMINI_API_KEY is not configured in Vercel Production.' });
  try {
    const { mode = 'analyze', question = '', leads = [], properties = [] } = req.body || {};
    const safeLeads = Array.isArray(leads) ? leads.slice(0, 100).map((l: any) => ({ name: l.name || '', source: l.form_name || '', leadType: l.lead_type || '', propertyType: l.property_type || '', location: l.location || '', budget: l.budget || '', timeline: l.timeline || '', requirement: l.requirement || '', message: l.message || '', status: l.status || 'New', priority: l.priority || 'Warm', nextAction: l.nextAction || 'Call', followUp: l.followUp || '' })) : [];
    const safeProperties = Array.isArray(properties) ? properties.slice(0, 100).map((p: any) => ({ title: p.title || '', propertyType: p.propertyType || '', location: p.location || '', price: p.price || '', area: p.area || '', status: p.status || '' })) : [];
    const instructions = question.trim() ? `Answer the user's CRM/sales question directly. You are the sales manager for Anjanay Heights. Use only the supplied CRM and property facts. If data is missing, say so instead of inventing it. User question: ${question.trim()}` : mode === 'campaign' ? 'Create a practical 7-day lead-generation plan for Anjanay Heights using these existing leads and properties. Prioritize high-value real-estate leads, WhatsApp, Instagram/Facebook, Google Search, direct seller outreach, and referral activity. Give daily actions, sample ad/message angles, and KPIs. Do not invent property facts.' : mode === 'followup' ? 'Create ready-to-send WhatsApp follow-up messages for the most actionable leads. Group them into Hot, Warm, and New. Keep messages short, professional, natural Indian business English/Hinglish, and based only on the supplied facts. Also recommend the next action and timing.' : 'Act as the sales manager for Anjanay Heights. Analyze the leads, identify the top 10 opportunities, explain why each is important, suggest the next action, and identify missing information that should be collected. Then give a short daily priority list. Do not invent facts.';
    const prompt = `${instructions}\n\nLEADS:\n${JSON.stringify(safeLeads)}\n\nAVAILABLE PROPERTIES:\n${JSON.stringify(safeProperties)}\n\nReturn a concise, actionable answer with headings and bullet points. The user is a real-estate broker and wants more qualified leads and faster conversions.`;
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    const response = await ai.models.generateContent({ model, contents: prompt, config: { maxOutputTokens: 1800 } });
    const text = response.text?.trim();
    if (!text) return res.status(502).json({ error: 'AI returned an empty response. Please try again.' });
    return res.status(200).json({ text, model });
  } catch (error) {
    console.error('AI lead assistant error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'AI request failed' });
  }
}
