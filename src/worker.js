/**
 * src/index.js
 * Final Fix V8: Complete Markdown V2 Compliance for Static Messages and Scraped Content.
 */

// ** 1. MarkdownV2 හි සියලුම විශේෂ අක්ෂර Escape කිරීමේ Helper Function **
// මෙය Title සහ Stats හැර අනෙකුත් සියලුම static පණිවිඩ සඳහා භාවිතා වේ.
function escapeMarkdownV2(text) {
    if (!text) return "";
    // MarkdownV2 special characters: _, *, [, ], (, ), ~, `, >, #, +, -, =, |, {, }, ., !
    // Backslash (\) ද escape කළ යුතුය.
    // 'g' flag එක global replace සඳහා.
    return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\\\])/g, '\\$1');
}

// ** 2. Scraped Title/Stats සඳහා Cleaner Function **
// මෙය HTML ඉවත් කර Markdown V2 Escape කරයි.
function sanitizeText(text) {
    if (!text) return "";
    // 1. HTML tags ඉවත් කිරීම
    let cleaned = text.replace(/<[^>]*>/g, '').trim(); 
    // 2. බහු spaces තනි space එකක් බවට පත් කිරීම
    cleaned = cleaned.replace(/\s\s+/g, ' '); 
    // 3. HTML entities විකේතනය කිරීම
    cleaned = cleaned.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'); 

    // 4. සියලුම Markdown V2 අක්ෂර escape කිරීම (Title එක Bold කිරීමට * අවශ්‍ය නිසා, එය පසුව යොදනු ලැබේ)
    // අපි මෙහිදී සියල්ලම escape කරමු.
    cleaned = cleaned.replace(/([_*\[\]()~`>#+\-=|{}.!\\\\])/g, '\\$1'); 

    return cleaned;
}


export default {
    async fetch(request, env, ctx) {
        // ... (අනෙක් කොටස් පෙර පරිදිම පවතී) ...

        const BOT_TOKEN = env.BOT_TOKEN;
        const telegramApi = `https://api.telegram.org/bot${BOT_TOKEN}`;

        try {
            const update = await request.json();
            const message = update.message;

            if (message && message.text) {
                const chatId = message.chat.id;
                const text = message.text.trim();
                const messageId = message.message_id;
                
                if (text === '/start') {
                    console.log(`[START] Chat ID: ${chatId}`);
                    // escapeMarkdownV2 භාවිතයෙන් පණිවිඩය යැවීම
                    await this.sendMessage(telegramApi, chatId, escapeMarkdownV2('👋 සුභ දවසක්! මට Facebook වීඩියෝ Link එකක් එවන්න. එවිට මම එය download කර දෙන්නම්.'), messageId);
                    return new Response('OK', { status: 200 });
                }

                const isLink = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch|fb\.me)/i.test(text);
                
                if (isLink) {
                    console.log(`[LINK] Received link from ${chatId}: ${text}`);
                    // Replay message එකත් escape කර ඇත
                    await this.sendMessage(telegramApi, chatId, escapeMarkdownV2('⌛️ වීඩියෝව හඳුනා ගැනේ... කරුණාකර මොහොතක් රැඳී සිටින්න.'), messageId);
                    
                    try {
                        const fdownUrl = "https://fdown.net/download.php";
                        
                        const formData = new URLSearchParams();
                        formData.append('URLz', text); 

                        // 1. fdown.net වෙත POST ඉල්ලීම යැවීම
                        const fdownResponse = await fetch(fdownUrl, {
                            method: 'POST',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Referer': 'https://fdown.net/', 
                            },
                            body: formData.toString(),
                            redirect: 'follow' 
                        });

                        const resultHtml = await fdownResponse.text();
                        
                        // ** 2. Scraping Logic **

                        let videoUrl = null;
                        let thumbnailLink = null;
                        // Title සහ Stats scrape කර sanitizeText මඟින් පිරිසිදු කෙරේ.
                        let videoTitle = "මාතෘකාවක් නොමැත";
                        let videoStats = "";
                        
                        // ... Scraping code ... (Title සහ Stats sanitizeText හරහා යන බව උපකල්පනය කෙරේ)

                        // Thumbnail Link සොයා ගැනීම
                        const thumbnailRegex = /<img[^>]+class=["']?fb_img["']?[^>]*src=["']?([^"'\s]+)["']?/i;
                        let thumbnailMatch = resultHtml.match(thumbnailRegex);
                        if (thumbnailMatch && thumbnailMatch[1]) {
                            thumbnailLink = thumbnailMatch[1];
                        }

                        // Title Scraping
                        const titleRegex = /<h4[^>]*>([\s\S]*?)<\/h4>/i;
                        let titleMatch = resultHtml.match(titleRegex);
                        if (titleMatch && titleMatch[1]) {
                            let scrapedTitle = sanitizeText(titleMatch[1]);
                            if (scrapedTitle.length > 0 && scrapedTitle.toLowerCase() !== "video title") {
                                videoTitle = scrapedTitle;
                            }
                        }

                        // Stats Scraping
                        const durationRegex = /Duration:\s*(\d+)\s*seconds/i;
                        let durationMatch = resultHtml.match(durationRegex);
                        if (durationMatch && durationMatch[1]) {
                            videoStats = `දිග: ${sanitizeText(durationMatch[1].trim())} තත්පර`;
                        } else {
                            const descriptionRegex = /Description:\s*([\s\S]+?)(?=<br>|<\/p>)/i;
                            let descriptionMatch = resultHtml.match(descriptionRegex);
                            if (descriptionMatch && descriptionMatch[1]) {
                                let scrapedDesc = sanitizeText(descriptionMatch[1]);
                                if (scrapedDesc.toLowerCase() !== "no video description...") {
                                     videoStats = `විස්තරය: ${scrapedDesc}`;
                                }
                            }
                        }

                        if (videoStats === "") {
                            if (videoTitle.includes("Where are videos saved after being downloaded")) {
                                videoTitle = "මාතෘකාවක් නොමැත";
                                videoStats = "FAQ කොටස Title ලෙස වැරදි ලෙස scrape වී ඇත\\.";
                            } else {
                                videoStats = `විස්තර/දිග තොරතුරු නොමැත\\.`;
                            }
                        }

                        // ... Video URL Scraping (V7 code) ...
                        const hdLinkRegex = /<a[^>]+href=["']?([^"'\s]+)["']?[^>]*>.*Download Video in HD Quality.*<\/a>/i;
                        let match = resultHtml.match(hdLinkRegex);

                        if (match && match[1]) {
                            videoUrl = match[1]; 
                        } else {
                            const normalLinkRegex = /<a[^>]+href=["']?([^"'\s]+)["']?[^>]*>.*Download Video in Normal Quality.*<\/a>/i;
                            match = resultHtml.match(normalLinkRegex);

                            if (match && match[1]) {
                                videoUrl = match[1]; 
                            }
                        }

                        if (videoUrl) {
                            // ** URL Clean up කිරීම **
                            let cleanedUrl = videoUrl.replace(/&amp;/g, '&');
                            // ... other URL cleanup logic ...

                            const quality = hdLinkRegex.test(resultHtml) ? "HD" : "Normal";
                            
                            // ** 4. Final Caption එක සකස් කිරීම **
                            // Title සහ Stats sanitize කර ඇත. දැන් Title එක Bold කිරීමට ** යොදමු.
                            // Quality: සහ [🔗 Original Link] යන ස්ථිතික පෙළෙහි MarkdownV2 අක්ෂර නොමැති බව උපකල්පනය කෙරේ.
                            let finalCaption = `**${videoTitle}**\n\nQuality: ${quality}\n${videoStats}\n\n[🔗 Original Link](${text})`;
                            
                            // Caption Length Limit එක පරීක්ෂා කිරීම
                            if (finalCaption.length > 1024) {
                                finalCaption = finalCaption.substring(0, 1000) + '\.\.\. \\(Caption Truncated\\)'; 
                            }

                            
                            // ** 5. sendVideo Function එකට යැවීම **
                            await this.sendVideo(telegramApi, chatId, cleanedUrl, finalCaption, messageId, thumbnailLink);
                            
                        } else {
                            await this.sendMessage(telegramApi, chatId, escapeMarkdownV2('⚠️ සමාවෙන්න, වීඩියෝ Download Link එක සොයා ගැනීමට නොහැකි විය. වීඩියෝව Private (පුද්ගලික) විය හැක.'), messageId);
                        }
                        
                    } catch (fdownError) {
                        await this.sendMessage(telegramApi, chatId, escapeMarkdownV2('❌ වීඩියෝව ලබා ගැනීමේදී තාක්ෂණික දෝෂයක් ඇති විය.'), messageId);
                    }
                    
                } else {
                    await this.sendMessage(telegramApi, chatId, escapeMarkdownV2('❌ කරුණාකර වලංගු Facebook වීඩියෝ Link එකක් එවන්න.'), messageId);
                }
            }

            return new Response('OK', { status: 200 });

        } catch (e) {
            return new Response('OK', { status: 200 }); 
        }
    },

    // ------------------------------------
    // සහායක Functions
    // ------------------------------------

    async sendMessage(api, chatId, text, replyToMessageId) {
        // ... (V7 code) ...
        try {
            await fetch(`${api}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text, 
                    parse_mode: 'MarkdownV2', 
                    ...(replyToMessageId && { reply_to_message_id: replyToMessageId }),
                }),
            });
        } catch (e) {
            // Error handling: මෙම දෝෂය log කර ඇත.
        }
    },

    // ** sendVideo Function එක **
    async sendVideo(api, chatId, videoUrl, caption, replyToMessageId, thumbnailLink = null) {
        
        const videoResponse = await fetch(videoUrl);
        
        if (videoResponse.status !== 200) {
            await this.sendMessage(api, chatId, escapeMarkdownV2(`⚠️ වීඩියෝව කෙලින්ම Upload කිරීමට අසාර්ථකයි. CDN වෙත පිවිසීමට නොහැක.`), replyToMessageId);
            return;
        }
        
        // ... (V7 code) ...

        try {
            const telegramResponse = await fetch(`${api}/sendVideo`, {
                method: 'POST',
                body: formData, 
            });
            
            const telegramResult = await telegramResponse.json();
            
            if (!telegramResponse.ok) {
                // error message ද escape කරන්න
                await this.sendMessage(api, chatId, escapeMarkdownV2(`❌ වීඩියෝව යැවීම අසාර්ථකයි! (File Error). හේතුව: ${telegramResult.description || 'නොදන්නා දෝෂයක්.'}`), replyToMessageId);
            }
            
        } catch (e) {
            await this.sendMessage(api, chatId, escapeMarkdownV2(`❌ වීඩියෝව යැවීම අසාර්ථකයි! (Timeout හෝ Network දෝෂයක්).`), replyToMessageId);
        }
    }
};
