import OpenAI from 'openai';
import Product from '../models/Product.js';

const getProductUrl = (product) => `/products/${encodeURIComponent(product.category)}/${product._id}`;

export const chatWithAi = async (req, res) => {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ success: false, message: 'A message is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ success: false, message: 'AI chat is not configured yet' });
    }

    try {
        const products = await Product.find({ isVisible: true, inStock: true })
            .select('_id name category price offerPrice description')
            .limit(150)
            .lean();

        const catalog = products.map((product) => ({
            id: product._id.toString(),
            name: product.name,
            category: product.category,
            price: product.price,
            offerPrice: product.offerPrice,
            description: Array.isArray(product.description) ? product.description.join(', ') : product.description,
        }));

        const safeHistory = Array.isArray(history)
            ? history
                .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.text === 'string')
                .slice(-8)
                .map((item) => ({ role: item.role, content: item.text.slice(0, 1000) }))
            : [];

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            temperature: 0.4,
            response_format: { type: 'json_object' },
            messages: [
                {
                    role: 'system',
                    content: `You are Eimi AI, a concise and helpful grocery shopping assistant for EimiCart. Answer the user's question using the catalog when relevant. Never invent products, prices, availability, or product IDs. Recommend at most 3 catalog products. Return valid JSON with exactly two fields: reply (a friendly plain-text answer) and productIds (an array of catalog id strings). Only include productIds when showing those products would help answer the question. Do not include markdown links in reply. Catalog: ${JSON.stringify(catalog)}`,
                },
                ...safeHistory,
                { role: 'user', content: message.trim().slice(0, 2000) },
            ],
        });

        const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
        const validProducts = products.filter((product) =>
            Array.isArray(parsed.productIds) && parsed.productIds.includes(product._id.toString())
        ).slice(0, 3);

        return res.json({
            success: true,
            reply: typeof parsed.reply === 'string' ? parsed.reply : 'I could not find a helpful answer. Please try asking in another way.',
            products: validProducts.map((product) => ({
                id: product._id.toString(),
                name: product.name,
                price: product.offerPrice,
                url: getProductUrl(product),
            })),
        });
    } catch (error) {
        console.error('AI chat error:', error);
        return res.status(500).json({ success: false, message: 'The AI assistant is temporarily unavailable' });
    }
};
