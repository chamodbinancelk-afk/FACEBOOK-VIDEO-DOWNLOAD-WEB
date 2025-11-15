// --- 1. Variables and Constants (ටෝකන සහ URL) ---

// ********* ඔබගේ සැබෑ ටෝකන සහ Secret *********
const BOT_TOKEN = "8382727460:AAEgKVISJN5TTuV4O-82sMGQDG3khwjiKR8"; 
const WEBHOOK_SECRET = "ec6bc090856641e9b2aca785d7a34727"; 
// ***********************************************

const TELEGRAM_API = "https://api.telegram.org/bot";

// ⚠️ වැදගත්: මෙය උපකල්පිත API එකකි. Bot එක ක්‍රියා නොකරන්නේ නම්, මෙය අක්‍රීයයි.
const FB_API_URL = "https://api.some-fb-downloader.com/get_video?url="; 

// --- 2. Telegram API Interaction (Telegram API අන්තර්ක්‍රියා) ---

async function sendMessage(chat_id, text) {
    const url = `${TELEGRAM_API}${BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: chat_id,
        text: text,
        parse_mode: 'Markdown'
    };

    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

async function sendVideoFromUrl(chat_id, video_url, quality) {
    const url = `${TELEGRAM_API}${BOT_TOKEN}/sendVideo`;
    const payload = {
        chat_id: chat_id,
        video: video_url, 
        caption: `✅ Facebook වීඩියෝව බාගත කරන ලදී! (${quality})`
    };

    return fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
}

// --- 3. Facebook Video Downloader Logic (වීඩියෝ බාගත කිරීමේ තර්කය) ---

async function getFbVideoLinks(videoUrl) {
    try {
        const apiResponse = await fetch(`${FB_API_URL}${encodeURIComponent(videoUrl)}`);
        
        if (!apiResponse.ok) {
            // Log 1: API එකෙන් 200 OK හැර වෙනත් තත්ත්ව කේතයක් ලැබුණහොත්
            console.error(`API response status: ${apiResponse.status}`);
            return null;
        }
        
        const data = await apiResponse.json(); 
        
        // Log 2: API එකෙන් ලැබෙන සම්පූර්ණ JSON ප්‍රතිචාරය සටහන් කිරීම
        console.log("API Full Response Data:", data); 

        // අපි උපකල්පනය කරන API ප්‍රතිචාර ව්‍යුහය පරීක්ෂා කිරීම:
        // { "status": "ok", "links": [ { "quality": "HD", "url": "..." }, { "quality": "SD", "url": "..." } ] }
        if (data && data.status === 'ok' && Array.isArray(data.links)) {
            
            // HD සබැඳිය සෙවීම
            const hdLink = data.links.find(link => link.quality && (link.quality.toUpperCase() === 'HD' || link.quality.includes('720p')) && link.url)?.url;
            // SD සබැඳිය සෙවීම
            const sdLink = data.links.find(link => link.quality && (link.quality.toUpperCase() === 'SD' || link.quality.includes('360p')) && link.url)?.url;

            return {
                hd: hdLink,
                sd: sdLink
            };
        }
        
        // Log 3: JSON ලැබුණත් ව්‍යුහය නොගැලපේ නම්
        console.error("API response structure unexpected or links not found:", data);
        return null; 

    } catch (error) {
        // Log 4: Fetch කිරීමේ දෝෂ (උදා: ජාල සම්බන්ධතා දෝෂ)
        console.error("Facebook API fetch error:", error);
        return null;
    }
}

// --- 4. Main Handler (ප්‍රධාන Webhook හැසිරවීම) ---

async function handleTelegramWebhook(request) {
    const secret = request.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 401 }); 
    }
    
    const update = await request.json();

    if (!update.message || !update.message.text) {
        return new Response('No message text', { status: 200 });
    }

    const chatId = update.message.chat.id;
    const text = update.message.text.trim();
    
    if (text.startsWith('/start') || text.startsWith('/help')) {
        await sendMessage(chatId, "👋 **ආයුබෝවන්!** මම Facebook වීඩියෝ බාගත කරන්නා. මට Facebook වීඩියෝ සබැඳියක් (link) එවන්න.");
        return new Response('Start command handled', { status: 200 });
    }

    const fbUrlMatch = text.match(/https?:\/\/(?:www\.|m\.)?facebook\.com\/\S+/i);
    if (fbUrlMatch) {
        const fbUrl = fbUrlMatch[0];
        await sendMessage(chatId, "⏳ වීඩියෝ සබැඳිය විශ්ලේෂණය කරමින්... කරුණාකර මොහොතක් රැඳී සිටින්න.");
        
        const videoLinks = await getFbVideoLinks(fbUrl);

        if (videoLinks && videoLinks.hd) {
            await sendVideoFromUrl(chatId, videoLinks.hd, 'HD');
        } else if (videoLinks && videoLinks.sd) {
            await sendVideoFromUrl(chatId, videoLinks.sd, 'SD');
        } else {
            await sendMessage(chatId, "❌ වීඩියෝ සබැඳිය ලබා ගැනීමට නොහැකි විය. සබැඳිය නිවැරදි දැයි පරීක්ෂා කරන්න, නැතහොත් Bot ගේ API සේවාව අක්‍රිය විය හැක.");
        }
        
    } else {
        await sendMessage(chatId, "💡 කරුණාකර වලංගු Facebook වීඩියෝ සබැඳියක් පමණක් එවන්න.");
    }

    return new Response('Message handled', { status: 200 });
}

// --- 5. Cloudflare Worker Fetch Listener (Workers ප්‍රධාන පිවිසුම) ---

addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    if (request.method === 'POST') {
        event.respondWith(handleTelegramWebhook(request));
    } 
    else if (url.pathname === '/registerWebhook') {
        event.respondWith(registerWebhook(url.origin));
    }
    else {
        event.respondWith(new Response('Bot is running.', { status: 200 }));
    }
});

async function registerWebhook(workerUrl) {
    const webhookUrl = `${workerUrl}`; 
    const url = `${TELEGRAM_API}${BOT_TOKEN}/setWebhook?url=${webhookUrl}&secret_token=${WEBHOOK_SECRET}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(`Error registering webhook: ${error.message}`, { status: 500 });
    }
}
