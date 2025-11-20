/**
 * src/index.js
 * Final Code V24 (Start Command Fully Implemented for Owner and Users)
 * Developer: @chamoddeshan
 */

// *****************************************************************
// ********** [ ඔබගේ අගයන් මෙහි ඇතුළත් කර ඇත ] ********************
// *****************************************************************
const BOT_TOKEN = '8382727460:AAEgKVISJN5TTuV4O-82sMGQDG3khwjiKR8'; 
const OWNER_ID = '1901997764'; 
// *****************************************************************

// Telegram API Base URL
const telegramApi = `https://api.telegram.org/bot${BOT_TOKEN}`;


// -------------------------------------------------------------------
// I. Helper Functions
// -------------------------------------------------------------------

function escapeMarkdownV2(text) {
    if (!text) return "";
    return text.replace(/([_*[\]()~`>#+\-=|{}.!\\\\])/g, '\\$1');
}

const PROGRESS_STATES = [
    { text: "𝙇𝙤𝙖𝙙𝙞𝙣𝙜…▒▒▒▒▒▒▒▒▒▒", percentage: "0%" },
    { text: "𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙ింగ్…█▒▒▒▒▒▒▒▒▒", percentage: "10%" },
    { text: "𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙ింగ్…██▒▒▒▒▒▒▒▒", percentage: "20%" },
    { text: "𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙ింగ్…███▒▒▒▒▒▒▒", percentage: "30%" },
    { text: "𝙐𝙥𝙡𝙤𝙖𝙙ింగ్…████▒▒▒▒▒▒", percentage: "40%" },
    { text: "𝙐𝙥𝙡𝙤𝙖𝙙ింగ్…█████▒▒▒▒▒", percentage: "50%" },
    { text: "𝙐𝙥𝙡𝙤𝙖𝙙ింగ్…██████▒▒▒▒", percentage: "60%" },
    { text: "𝙐𝙥𝙡𝙤𝙖𝙙ింగ్…███████▒▒▒", percentage: "70%" },
    { text: "𝙁𝙞𝙣𝙖𝙡𝙞𝙯𝙞𝙣𝙜…████████▒▒", percentage: "80%" },
    { text: "𝙁𝙞𝙣𝙖𝙡𝙞𝙯𝙞𝙣𝙜…█████████▒", percentage: "90%" },
    { text: "✅ 𝘿𝙤𝙣𝙚\\! ██████████", percentage: "100%" } 
];

// -------------------------------------------------------------------
// II. WorkerHandlers Class
// -------------------------------------------------------------------

class WorkerHandlers {
    
    constructor(env) {
        this.env = env;
        this.progressActive = true; 
    }

    async saveUserId(userId) {
        if (!this.env.USER_DATABASE) return; 
        const key = `user:${userId}`;
        const isNew = await this.env.USER_DATABASE.get(key) === null; 
        if (isNew) {
            try {
                await this.env.USER_DATABASE.put(key, "1"); 
            } catch (e) {
                console.error(`KV Error: Failed to save user ID ${userId}`, e);
            }
        }
    }
    
    async getAllUsersCount() {
        if (!this.env.USER_DATABASE) return 0;
        try {
            const list = await this.env.USER_DATABASE.list({ prefix: 'user:' });
            return list.keys.length;
        } catch (e) {
            console.error("KV Error: Failed to list user keys:", e);
            return 0;
        }
    }
    
    async broadcastMessage(fromChatId, messageId) { /* ... */ }
    async sendMessage(chatId, text, replyToMessageId, inlineKeyboard = null) { /* ... */ }
    async editMessage(chatId, messageId, text, inlineKeyboard = null) { /* ... */ }
    async deleteMessage(chatId, messageId) { /* ... */ }
    async sendMessageWithKeyboard(chatId, text, replyToMessageId, keyboard) { /* ... */ }
    async answerCallbackQuery(callbackQueryId, text) { /* ... */ }
    async sendVideo(chatId, videoUrl, caption = null, replyToMessageId, thumbnailLink = null, inlineKeyboard = null) { /* ... */ }

    // --- Progress Bar Simulation ---

    async simulateProgress(chatId, messageId, originalReplyId) { /* ... */ }
}


// -------------------------------------------------------------------
// V. Main Fetch Handler
// -------------------------------------------------------------------

export default {
    
    async fetch(request, env, ctx) {
        if (request.method !== 'POST') {
            return new Response('Hello, I am your FDOWN Telegram Worker Bot.', { status: 200 });
        }
        
        const handlers = new WorkerHandlers(env);
        
        const userInlineKeyboard = [
            [{ text: 'C D H Corporation © ✅', callback_data: 'ignore_c_d_h' }] 
        ];
        
        const initialProgressKeyboard = [
             [{ text: `${PROGRESS_STATES[0].text} ${PROGRESS_STATES[0].percentage}`, callback_data: 'ignore_progress' }]
        ];

        try {
            const update = await request.json();
            const message = update.message;
            const callbackQuery = update.callback_query;
            
            if (!message && !callbackQuery) {
                 return new Response('OK', { status: 200 });
            }
            ctx.waitUntil(new Promise(resolve => setTimeout(resolve, 0)));


            // --- 1. Message Handling ---
            if (message) { 
                const chatId = message.chat.id;
                const messageId = message.message_id;
                const text = message.text ? message.text.trim() : null; 
                const isOwner = OWNER_ID && chatId.toString() === OWNER_ID.toString();

                ctx.waitUntil(handlers.saveUserId(chatId));

                // A. Broadcast Message Logic
                if (isOwner && message.reply_to_message) {
                    // ... (Broadcast Logic) ...
                    
                    if (repliedMessage.text && repliedMessage.text.includes("කරුණාකර දැන් ඔබ යැවීමට අවශ්‍ය පණිවිඩය එවන්න:")) {
                        
                        const originalMessageId = messageId;
                        const originalChatId = chatId;

                        await handlers.editMessage(chatId, repliedMessage.message_id, escapeMarkdownV2("📣 Broadcast කිරීම ආරම්භ විය\\. කරුණාකර රැඳී සිටින්න\\."));
                        
                        const results = await handlers.broadcastMessage(originalChatId, originalMessageId);
                        
                        const resultMessage = escapeMarkdownV2(`Message Send Successfully ✅`) + `\n\n` + escapeMarkdownV2(`🚀 Send: ${results.successfulSends}`) + `\n` + escapeMarkdownV2(`❗️ Faild: ${results.failedSends}`);
                        
                        await handlers.sendMessage(chatId, resultMessage, originalMessageId);
                        
                        return new Response('OK', { status: 200 });
                    }
                }
                
                // B. /start command Handling (FIXED)
                if (text && text.toLowerCase().startsWith('/start')) {
                    
                    if (isOwner) {
                        // Owner Message and Admin Keyboard
                        const ownerText = escapeMarkdownV2("👑 *Welcome Back, Admin!* 👑\n\nමෙය ඔබගේ Admin Control Panel එකයි\\.");
                        const adminKeyboard = [
                            [{ text: '📊 Users Count', callback_data: 'admin_users_count' }],
                            [{ text: '📣 Broadcast', callback_data: 'admin_broadcast' }],
                            [{ text: 'C D H Corporation © ✅', callback_data: 'ignore_c_d_h' }] 
                        ];
                        await handlers.sendMessage(chatId, ownerText, messageId, adminKeyboard);
                    } else {
                        // Normal User Message
                        const userText = escapeMarkdownV2("👋 *ආයුබෝවන්*\\! *Facebook Video Downloader Bot* වෙත සාදරයෙන් පිළිගන්නවා\\.\n\nමෙම Bot මගින් ඔබට ඉතා පහසුවෙන් ඕනෑම *Public Facebook Video Link* එකක් Download කරගත හැක\\.\n\n👇 *භාවිතා කරන ආකාරය*:\n1\\. Facebook Video Link එකක් Copy කරන්න\\.\n2\\. ඒ Link එක මෙහි *Paste* කරන්න\\.\n3\\. වීඩියෝව ස්වයංක්‍රීයව ඔබට ලැබෙනු ඇත\\.");
                        await handlers.sendMessage(chatId, userText, messageId, userInlineKeyboard);
                    }
                    return new Response('OK', { status: 200 });
                }

                // C. Facebook Link Handling 
                if (text) { 
                    const isLink = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch|fb\.me)/i.test(text);
                    
                    if (isLink) {
                        
                        // 1. Initial Message Send
                        const initialText = escapeMarkdownV2('⌛️ වීඩියෝව හඳුනා ගැනේ... කරුණාකර මොහොතක් රැඳී සිටින්න\\.');
                        const progressMessageId = await handlers.sendMessage(
                            chatId, 
                            initialText, 
                            messageId, 
                            initialProgressKeyboard
                        );
                        
                        // 2. Start Progress Simulation in background
                        if (progressMessageId) {
                            ctx.waitUntil(handlers.simulateProgress(chatId, progressMessageId, messageId));
                        }
                        
                        // 3. Start Scraping and Fetching
                        try {
                            const fdownUrl = "https://fdown.net/download.php";
                            const formData = new URLSearchParams();
                            formData.append('URLz', text); 
                            
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
                            
                            let videoUrl = null;
                            let thumbnailLink = null;
                            
                            const thumbnailRegex = /<img[^>]+class=["']?fb_img["']?[^>]*src=["']?([^"'\s]+)["']?/i;
                            let thumbnailMatch = resultHtml.match(thumbnailRegex);
                            if (thumbnailMatch && thumbnailMatch[1]) {
                                thumbnailLink = thumbnailMatch[1];
                            }

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
                            
                            // 4. Send Video or Error
                            if (videoUrl) {
                                let cleanedUrl = videoUrl.replace(/&amp;/g, '&');
                                
                                handlers.progressActive = false; 
                                
                                if (progressMessageId) {
                                     await handlers.deleteMessage(chatId, progressMessageId);
                                }
                                
                                await handlers.sendVideo(
                                    chatId, 
                                    cleanedUrl, 
                                    null, 
                                    messageId, 
                                    thumbnailLink, 
                                    userInlineKeyboard
                                ); 
                                
                            } else {
                                console.error(`[DEBUG] Video Link not found for: ${text}`);
                                handlers.progressActive = false;
                                const errorText = escapeMarkdownV2('⚠️ සමාවෙන්න, වීඩියෝ Download Link එක සොයා ගැනීමට නොහැකි විය\\. වීඩියෝව Private \\(පුද්ගලික\\) විය හැක\\.');
                                if (progressMessageId) {
                                    await handlers.editMessage(chatId, progressMessageId, errorText); 
                                } else {
                                    await handlers.sendMessage(chatId, errorText, messageId);
                                }
                            }
                            
                        } catch (fdownError) {
                             console.error(`[DEBUG] FDown Scraping Error (Chat ID: ${chatId}):`, fdownError);
                             handlers.progressActive = false;
                             const errorText = escapeMarkdownV2('❌ වීඩියෝ තොරතුරු ලබා ගැනීමේදී දෝෂයක් ඇති විය\\.');
                             if (progressMessageId) {
                                 await handlers.editMessage(chatId, progressMessageId, errorText);
                             } else {
                                 await handlers.sendMessage(chatId, errorText, messageId);
                             }
                        }
                        
                    } else {
                        await handlers.sendMessage(chatId, escapeMarkdownV2('❌ කරුණාකර වලංගු Facebook වීඩියෝ Link එකක් එවන්න\\.'), messageId);
                    }
                } 
            }
            
            // --- 2. Callback Query Handling ---
            if (callbackQuery) {
                 const chatId = callbackQuery.message.chat.id;
                 const data = callbackQuery.data;
                 const messageId = callbackQuery.message.message_id;

                 if (data === 'ignore_progress') {
                     await handlers.answerCallbackQuery(callbackQuery.id, "🎬 වීඩියෝව සකස් වෙමින් පවතී...");
                     return new Response('OK', { status: 200 });
                 }
                 
                 // Owner Check for admin callbacks
                 if (OWNER_ID && chatId.toString() !== OWNER_ID.toString()) {
                      await handlers.answerCallbackQuery(callbackQuery.id, "❌ ඔබට මෙම විධානය භාවිතා කළ නොහැක\\.");
                      return new Response('OK', { status: 200 });
                 }

                 switch (data) {
                    case 'admin_users_count':
                        const usersCount = await handlers.getAllUsersCount();
                        const countMessage = escapeMarkdownV2(`📊 දැනට ඔබගේ Bot භාවිතා කරන Users ගණන: ${usersCount}`);
                        await handlers.editMessage(chatId, messageId, countMessage);
                        await handlers.answerCallbackQuery(callbackQuery.id, `Users ${usersCount} ක් සිටී.`);
                        break;
                    
                    case 'admin_broadcast':
                        const broadcastPrompt = escapeMarkdownV2(`📣 Broadcast පණිවිඩය\n\nකරුණාකර දැන් ඔබ යැවීමට අවශ්‍ය **Text, Photo, හෝ Video** එක **Reply** කරන්න\\.`);
                        await handlers.sendMessage(chatId, broadcastPrompt, messageId); 
                        await handlers.answerCallbackQuery(callbackQuery.id, "Broadcast කිරීම සඳහා පණිවිඩය සූදානම්.");
                        break;
                    
                    case 'ignore_c_d_h':
                        await handlers.answerCallbackQuery(callbackQuery.id, "මෙය තොරතුරු බොත්තමකි\\.");
                        break;
                }

                return new Response('OK', { status: 200 });
            }


            return new Response('OK', { status: 200 });

        } catch (e) {
            console.error("--- FATAL FETCH ERROR (Worker Logic Error) ---");
            console.error("The worker failed to process the update:", e);
            console.error("-------------------------------------------------");
            return new Response('OK', { status: 200 }); 
        }
    }
};

// -------------------------------------------------------------------
// [ Place the complete implementations of helper methods here 
//   to ensure the code is fully functional ]
// -------------------------------------------------------------------

// sendVideo (V23)
WorkerHandlers.prototype.sendVideo = async function (chatId, videoUrl, caption = null, replyToMessageId, thumbnailLink = null, inlineKeyboard = null) {
    console.log(`[DEBUG] Attempting to send video. URL: ${videoUrl.substring(0, 50)}...`);
    
    try {
        const videoResponse = await fetch(videoUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://fdown.net/',
            },
        });
        
        if (videoResponse.status !== 200) {
            console.error(`[DEBUG] Video Fetch Failed! Status: ${videoResponse.status} for URL: ${videoUrl}`);
            if (videoResponse.body) { await videoResponse.body.cancel(); }
            await this.sendMessage(chatId, escapeMarkdownV2(`⚠️ වීඩියෝව කෙලින්ම Upload කිරීමට අසාර්ථකයි\\. CDN වෙත පිවිසීමට නොහැක\\. \\(HTTP ${videoResponse.status}\\)`), replyToMessageId);
            return;
        }
        
        const videoBlob = await videoResponse.blob();
        
        const formData = new FormData();
        formData.append('chat_id', chatId);
        
        if (caption) {
            formData.append('caption', caption);
            formData.append('parse_mode', 'MarkdownV2'); 
        }
        
        if (replyToMessageId) {
            formData.append('reply_to_message_id', replyToMessageId);
        }
        
        console.log(`[DEBUG] Video Blob size: ${videoBlob.size} bytes`);
        formData.append('video', videoBlob, 'video.mp4'); 

        if (thumbnailLink) {
            try {
                const thumbResponse = await fetch(thumbnailLink);
                if (thumbResponse.ok) {
                    const thumbBlob = await thumbResponse.blob();
                    formData.append('thumb', thumbBlob, 'thumbnail.jpg');
                } else {
                    if (thumbResponse.body) { await thumbResponse.body.cancel(); }
                } 
            } catch (e) { 
                console.warn("Thumbnail fetch failed:", e);
            }
        }
        
        if (inlineKeyboard) {
            formData.append('reply_markup', JSON.stringify({
                inline_keyboard: inlineKeyboard
            }));
        }

        const telegramResponse = await fetch(`${telegramApi}/sendVideo`, {
            method: 'POST',
            body: formData, 
        });
        
        const telegramResult = await telegramResponse.json();
        
        if (!telegramResponse.ok) {
            console.error(`[DEBUG] sendVideo API Failed! Result:`, telegramResult);
            await this.sendMessage(chatId, escapeMarkdownV2(`❌ වීඩියෝව යැවීම අසාර්ථකයි! \\(Error: ${telegramResult.description || 'නොදන්නා දෝෂයක්\\.'}\\)`), replyToMessageId);
        } else {
             console.log(`[DEBUG] sendVideo successful.`);
        }
        
    } catch (e) {
        console.error(`[DEBUG] sendVideo General Error (Chat ID: ${chatId}):`, e);
        await this.sendMessage(chatId, escapeMarkdownV2(`❌ වීඩියෝව යැවීම අසාර්ථකයි! \\(Network හෝ Timeout දෝෂයක්\\)\\.`), replyToMessageId);
    }
}


// editMessage (V21/V23)
WorkerHandlers.prototype.editMessage = async function (chatId, messageId, text, inlineKeyboard = null) {
    try {
        const body = {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            parse_mode: 'MarkdownV2',
            ...(inlineKeyboard && { reply_markup: { inline_keyboard: inlineKeyboard } }),
        };
        const response = await fetch(`${telegramApi}/editMessageText`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        
        const result = await response.json(); 

         if (!response.ok) {
            if (result.error_code === 400 && result.description && result.description.includes("message to edit not found")) {
                 return;
            } else {
                 console.error(`editMessage API Failed (Chat ID: ${chatId}):`, result);
            }
        }
    } catch (e) { 
         console.error(`editMessage Fetch Error (Chat ID: ${chatId}):`, e);
    }
}


// sendMessage (V23)
WorkerHandlers.prototype.sendMessage = async function (chatId, text, replyToMessageId, inlineKeyboard = null) {
    try {
        const response = await fetch(`${telegramApi}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: text, 
                parse_mode: 'MarkdownV2', 
                ...(replyToMessageId && { reply_to_message_id: replyToMessageId }),
                ...(inlineKeyboard && { reply_markup: { inline_keyboard: inlineKeyboard } }),
            }),
        });
        const result = await response.json();
        if (!response.ok) {
            console.error(`sendMessage API Failed (Chat ID: ${chatId}):`, result);
            return null;
        }
        return result.result.message_id;
    } catch (e) { 
        console.error(`sendMessage Fetch Error (Chat ID: ${chatId}):`, e);
        return null;
    }
}

// deleteMessage (V23)
WorkerHandlers.prototype.deleteMessage = async function (chatId, messageId) {
    try {
        const response = await fetch(`${telegramApi}/deleteMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: messageId,
            }),
        });
         if (!response.ok) {
            console.warn(`deleteMessage API Failed (Chat ID: ${chatId}, Msg ID: ${messageId}):`, await response.text());
        }
    } catch (e) { 
         console.error(`deleteMessage Fetch Error (Chat ID: ${chatId}):`, e);
    }
}

// simulateProgress (V23)
WorkerHandlers.prototype.simulateProgress = async function (chatId, messageId, originalReplyId) {
    const originalText = escapeMarkdownV2('⌛️ වීඩියෝව හඳුනා ගැනේ... කරුණාකර මොහොතක් රැඳී සිටින්න\\.');
    
    const statesToUpdate = PROGRESS_STATES.slice(1, 10); 

    for (let i = 0; i < statesToUpdate.length; i++) {
        if (!this.progressActive) break; 
        
        await new Promise(resolve => setTimeout(resolve, 800)); 
        
        if (!this.progressActive) break; 

        const state = statesToUpdate[i];
        const newKeyboard = [
            [{ text: `${state.text} ${state.percentage}`, callback_data: 'ignore_progress' }]
        ];
        const newText = originalText + "\n" + escapeMarkdownV2(`\nStatus: ${state.text}`);
        
        this.editMessage(chatId, messageId, newText, newKeyboard);
    }
}
