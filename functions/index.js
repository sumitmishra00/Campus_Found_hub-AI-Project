// Step 1: Zaroori Libraries Import Karna
const functions = require("firebase-functions");
const { GoogleGenAI } = require("@google/genai");

// NEW: Firebase Admin SDK Import aur Initialize karna
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore(); // Firestore instance for server-side updates

// Step 2: Gemini AI Model Initialize Karna
const ai = new GoogleGenAI({});

// Step 3: Firebase Callable Function Create Karna (Updated for Background Update)
exports.processItemDescription = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { description, docId } = data; // docId bhi receive kar rahe hain
    
    if (!description || !docId) {
        console.error("Missing description or docId.");
        // Frontend ko koi error na dekar, sirf log karke return kar sakte hain
        return { success: false, message: "Missing description or Document ID." }; 
    }

    const prompt = `You are a helper for a lost and found system. A user has provided the following description of an item. 
        Analyze the description and extract the most relevant details into a structured JSON object. 
        The JSON must contain the fields: "item_type" (e.g., wallet, keys, laptop), "color", "location_found" (e.g., library, cafe, parking lot), and "date" (Approximate date, e.g., 'Yesterday' or 'Dec 24th'). 
        If a detail is missing, use "N/A" for that field.
        The output must be ONLY the JSON object.

        Description to analyze: "${description}"
        `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json", 
            },
        });

        const jsonText = response.text.trim();
        const jsonResult = JSON.parse(jsonText);

        // AI analysis ko Firestore mein update karna (Server Side)
        await db.collection('lostItems').doc(docId).update({
            ai_item_type: jsonResult.item_type || 'N/A',
            ai_color: jsonResult.color || 'N/A',
            ai_location: jsonResult.location_found || 'N/A',
            ai_date: jsonResult.date || 'N/A',
            analysis_status: 'Complete' // Analysis complete ho gayi
        });

        // Frontend ko sirf success message bhejna
        return {
            success: true,
            message: "Analysis complete and Firestore updated."
        };

    } catch (error) {
        console.error("Gemini API Error:", error);
        
        // Error hone par bhi Firestore mein status update kar sakte hain
        await db.collection('lostItems').doc(docId).update({
            analysis_status: 'Failed',
            error_message: error.message // Taki hum Firebase Console mein check kar saken
        });

        // Frontend ko error bhejna taaki log mein dikh sake
        throw new functions.https.HttpsError('internal', 'Could not process item description with AI.');
    }
});