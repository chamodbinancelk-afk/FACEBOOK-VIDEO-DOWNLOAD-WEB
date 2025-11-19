/**
 * src/index.js
 * Final Fix V13: Changed form data key from 'URLz' to 'q' for better compatibility.
 */

// ... (ඉහළ ශ්‍රිත නොවෙනස්ව තබන්න)

export default {
    async fetch(request, env, ctx) {
        // ... (ප්‍රධාන fetch ශ්‍රිතයේ ආරම්භය)

        const DOWNLOADER_URL = "https://fbdown.blog/FB-to-mp3-downloader"; 

        try {
            const update = await request.json();
            const message = update.message;

            if (message && message.text) {
                const chatId = message.chat.id;
                const text = message.text.trim();
                const messageId = message.message_id;
                
                // ... (start විධානය)
                
                const isLink = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch|fb\.me)/i.test(text);
                
                if (isLink) {
                    await this.sendMessage(telegramApi, chatId, escapeMarkdownV2('⌛️ වීඩියෝව හඳුනා ගැනේ... කරුණාකර මොහොතක් රැඳී සිටින්න.'), messageId);
                    
                    try {
                        
                        const formData = new URLSearchParams();
                        // ** V13 FIX: parameter නම 'q' ලෙස වෙනස් කිරීම **
                        formData.append('q', text); 

                        const downloaderResponse = await fetch(DOWNLOADER_URL, {
                            method: 'POST',
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Referer': 'https://fbdown.blog/', 
                            },
                            body: formData.toString(),
                            redirect: 'follow' 
                        });

                        const resultHtml = await downloaderResponse.text();
                        
                        let videoUrl = null;
                        let thumbnailLink = null;
                        
                        // Thumbnail Link Scraping
                        const thumbnailRegex = /<img[^>]+src=["']?([^"'\s]+)["']?[^>]*width=["']?300px["']?/i;
                        let thumbnailMatch = resultHtml.match(thumbnailRegex);
                        if (thumbnailMatch && thumbnailMatch[1]) {
                            thumbnailLink = thumbnailMatch[1];
                        }

                        // Video Link Scraping
                        const linkRegex = /<a[^>]+href=["']?([^"'\s]+)["']?[^>]*target=["']?_blank["']?[^>]*>Download<\/a>/i;
                        let match = resultHtml.match(linkRegex);

                        if (match && match[1]) {
                            videoUrl = match[1]; 
                        } 
                        
                        if (videoUrl) {
                            let cleanedUrl = videoUrl.replace(/&amp;/g, '&');
                            await this.sendVideo(telegramApi, chatId, cleanedUrl, null, messageId, thumbnailLink); 
                            
                        } else {
                            // ** Debugging Log - Link සොයා ගැනීමට නොහැකි වූ විට **
                            // දැන් HTML හිස් වූවාද නැතිද යන්න මෙයින් පෙන්වනු ඇත.
                            console.log(`Video URL not found. HTML snippet (1000 chars): ${resultHtml.substring(0, 1000)}`); 
                            await this.sendMessage(telegramApi, chatId, escapeMarkdownV2('⚠️ සමාවෙන්න, වීඩියෝ Download Link එක සොයා ගැනීමට නොහැකි විය\\. \\(Private හෝ HTML ව්‍යුහය වෙනස් වී තිබිය හැක\\)'), messageId);
                        }
                        
                    } catch (fdownError) {
                        console.error('FDOWN_API_ERROR:', fdownError.message); 
                        await this.sendMessage(telegramApi, chatId, escapeMarkdownV2('❌ වීඩියෝ තොරතුරු ලබා ගැනීමේදී දෝෂයක් ඇති විය\\. \\(Network හෝ URL වැරදි විය හැක\\)'), messageId);
                    }
                    
                } else {
                    await this.sendMessage(telegramApi, chatId, escapeMarkdownV2('❌ කරුණාකර වලංගු Facebook වීඩියෝ Link එකක් එවන්න\\.'), messageId);
                }
            }

            return new Response('OK', { status: 200 });

        } catch (e) {
            console.error('MAIN_WORKER_ERROR:', e.message);
            return new Response('OK', { status: 200 }); 
        }
    },
    // ... (සහායක sendMessag/sendVideo ශ්‍රිත නොවෙනස්ව තබන්න)
};
