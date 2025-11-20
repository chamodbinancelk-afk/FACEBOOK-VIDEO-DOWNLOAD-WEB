/**
 * src/index.js
 * Final Code V20 (Stops logging "message to edit not found" error to console)
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
    
    async getAllUsersCount() { /* ... */ }
    async broadcastMessage(fromChatId, messageId) { /* ... */ }

    async sendMessage(chatId, text, replyToMessageId, inlineKeyboard = null) {
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

    /**
     * Edit message text/keyboard. FIX: Stops logging "message to edit not found" error.
     */
    async editMessage(chatId, messageId, text, inlineKeyboard = null) {
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
                // FIX: Error 400 (message to edit not found) සම්පූර්ණයෙන්ම නිශ්ශබ්ද කිරීම.
                if (result.error_code === 400 && result.description && result.description.includes("message to edit not found")) {
                     // NO LOGGING HERE
                } else {
                     console.error(`editMessage API Failed (Chat ID: ${chatId}):`, result);
                }
            }
        } catch (e) { 
             console.error(`editMessage Fetch Error (Chat ID: ${chatId}):`, e);
        }
    }
    
    async deleteMessage(chatId, messageId) {
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
                // Already deleted message errors are ignored here (using warn)
                console.warn(`deleteMessage API Failed (Chat ID: ${chatId}, Msg ID: ${messageId}):`, await response.text());
            }
        } catch (e) { 
             console.error(`deleteMessage Fetch Error (Chat ID: ${chatId}):`, e);
        }
    }

    async sendMessageWithKeyboard(chatId, text, replyToMessageId, keyboard) { /* ... */ }
    async answerCallbackQuery(callbackQueryId, text) { /* ... */ }
    async sendVideo(chatId, videoUrl, caption = null, replyToMessageId, thumbnailLink = null, inlineKeyboard = null) { /* ... */ }

    // --- Progress Bar Simulation ---

    async simulateProgress(chatId, messageId, originalReplyId) {
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
                    const repliedMessage = message.reply_to_message;
                    
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
                
                // B. /start command Handling (remains the same)

                // C. Facebook Link Handling (Progress Bar & Delete Fix)
                if (text) { 
                    const isLink = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch|fb\.me)/i.test(text);
                    
                    if (isLink) {
                        
                        // 1. Initial Message Send (Progress 0%)
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
                            // ... (Scraping logic) ...

                            if (videoUrl) {
                                let cleanedUrl = videoUrl.replace(/&amp;/g, '&');
                                
                                handlers.progressActive = false; 
                                
                                // FIX: Loading Message එක Delete කරන්න
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
                                handlers.progressActive = false;
                                const errorText = escapeMarkdownV2('⚠️ සමාවෙන්න, වීඩියෝ Download Link එක සොයා ගැනීමට නොහැකි විය\\. වීඩියෝව Private \\(පුද්ගලික\\) විය හැක\\.');
                                if (progressMessageId) {
                                    await handlers.editMessage(chatId, progressMessageId, errorText); 
                                } else {
                                    await handlers.sendMessage(chatId, errorText, messageId);
                                }
                            }
                            
                        } catch (fdownError) {
                             handlers.progressActive = false;
                             console.error(`FDown Scraping Error (Chat ID: ${chatId}):`, fdownError);
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
                 // ... (Callback Logic remains the same) ...
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
