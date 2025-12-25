// ================= FIREBASE IMPORTS =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";

import {
  getAuth,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import {
    getStorage, 
    ref as storageRef, 
    uploadBytes, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js"; 

// 🔴 NOTE: Cloud Functions Imports are now unnecessary for zero-cost demo
// import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js"; 


// ================= FIREBASE CONFIG =================
const firebaseConfig = {
  apiKey: "AIzaSyDYuaXLWD9Xhoj92-TdBPDFO25O5kHyF-0", 
  authDomain: "campus-found-hub.firebaseapp.com",
  projectId: "campus-found-hub",
  storageBucket: "campus-found-hub.appspot.com", 
  messagingSenderId: "651993537804",
  appId: "1:651993537804:web:12e16029721d4aab6a7d29"
};

// ================= INITIALIZE =================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 

// 🔴 NOTE: Functions Initialization and processItem are removed to avoid credit card prompt
console.log("🔥 Firebase Connected Successfully (Zero-Cost Deployment Ready)");

// ================= LOGIN STATUS CHECK & UI UPDATE =================
const loginSection = document.getElementById('email').closest('.card');
const userInfo = document.getElementById('userInfo');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const logoutBtn = document.getElementById('logoutBtn');
const forms = document.querySelectorAll('.tab-content form');

onAuthStateChanged(auth, (user) => {
    if (user) {
        // Logged in
        loginSection.style.display = 'none';
        userInfo.style.display = 'block';
        userEmailDisplay.textContent = user.email;
        forms.forEach(form => form.style.opacity = 1); // Enable forms
        console.log("User Logged In:", user.email);
    } else {
        // Logged out
        loginSection.style.display = 'block';
        userInfo.style.display = 'none';
        forms.forEach(form => form.style.opacity = 0.5); // Disable forms
        console.log("User Logged Out");
    }
});

logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await signOut(auth);
    alert("You have been logged out.");
});

// ================= LOGIN LOGIC (UNCHANGED) =================
const loginBtn = document.getElementById("loginBtn");
const statusText = document.getElementById("status");

loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;

    if (!email) {
        statusText.innerText = "Please enter email";
        return;
    }

    const actionCodeSettings = {
        // NOTE: window.location.origin use karne se dynamic URL banta hai
        url: window.location.origin + "/index.html", 
        handleCodeInApp: true
    };

    try {
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        localStorage.setItem("emailForSignIn", email);
        statusText.innerText = "Login link sent to your email 📩. Please check your inbox!";
    } catch (error) {
        statusText.innerText = `Error: ${error.message}`;
    }
});

// ================= AUTO SIGN-IN (UNCHANGED) =================
if (isSignInWithEmailLink(auth, window.location.href)) {
    const savedEmail = localStorage.getItem("emailForSignIn");
    const emailInput = document.getElementById('email');

    if (savedEmail) {
        emailInput.value = savedEmail; 
        signInWithEmailLink(auth, savedEmail, window.location.href)
            .then(async (result) => {
                const user = result.user;

                await setDoc(doc(db, "users", user.uid), {
                    email: user.email,
                    createdAt: serverTimestamp()
                }, { merge: true }); 

                statusText.innerText = "✅ Logged in successfully!";
                localStorage.removeItem("emailForSignIn");
            })
            .catch((err) => {
                statusText.innerText = `Sign-in failed: ${err.message}`;
            });
    }
}


// ================= 🚀 FAST LOST ITEM POST WITH MOCK AI ANALYSIS (New Zero-Cost Logic) =================
document.getElementById('lostItemForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
        alert("Please login first to report a lost item.");
        return;
    }

    const photoFile = document.getElementById('lostItemPhoto').files[0];
    const itemName = document.getElementById('lostItemName').value;
    const itemCategory = document.getElementById('lostItemCategory').value;
    const itemDesc = document.getElementById('lostItemDesc').value;
    const postStatus = document.getElementById('lostPostStatus');

    // MANDATORY CHECK
    if (!itemDesc || !itemName || !itemCategory) {
        postStatus.innerText = '❌ Please fill out the Name, Category, and Description fields.';
        return;
    }

    const submitBtn = document.getElementById('submitLostItemBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Uploading... Please wait.';

    let photoURL = '';

    try {
        // --- 1. Uploading Image to Firebase Storage (Same as before) ---
        if (photoFile) {
            const uniqueName = Date.now() + '_' + photoFile.name;
            const imageRef = storageRef(storage, 'lost-items/' + uniqueName);
        
            const snapshot = await uploadBytes(imageRef, photoFile);
            photoURL = await getDownloadURL(snapshot.ref);
        }

        // --- 2. Simulating AI Analysis and preparing final data ---
        // Yahan hum description se kuch keywords nikal kar AI analysis ka mock kar rahe hain.
        const mockColor = itemDesc.match(/(red|blue|black|green|brown|silver)/i)?.[0] || 'Unspecified';
        const mockLocation = itemDesc.match(/(library|canteen|gate|hostel|cafe)/i)?.[0] || 'General Campus';
        
        // --- 3. Saving Data with MOCKED AI Fields to Firestore (Hosting only) ---
        await addDoc(collection(db, "lostItems"), { 
            name: itemName,
            category: itemCategory,
            description: itemDesc,
            photoUrl: photoURL || '', 
            status: "Lost",
            reportedBy: auth.currentUser.email,
            reportedAt: serverTimestamp(),
            
            // 🔴 MOCKED AI FIELDS: Claim logic ab in fields par depend karega.
            ai_item_type: itemName,
            ai_color: mockColor,
            ai_location: mockLocation,
            ai_date: new Date().toISOString().split('T')[0],
            analysis_status: 'Completed' // Claim Logic isko check karta hai
        });

        postStatus.innerText = '✅ Lost Item submitted! AI analysis (Simulated) completed.';
        document.getElementById('lostItemForm').reset();
        
    } catch (error) {
        console.error("Error during submission: ", error);
        postStatus.innerText = `❌ Submission failed: ${error.message}.`;
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Lost Item';
    }
});


// ================= FOUND ITEM POST (Modified) =================
document.getElementById("foundItemForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!auth.currentUser) {
        alert("Please login first to post a found item.");
        return;
    }

    const name = document.getElementById("itemName").value;
    const category = document.getElementById("itemCategory").value;
    const location = document.getElementById("foundLocation").value;
    // Note: 'foundItemDesc' ab HTML mein hai aur optional hai
    const description = document.getElementById("foundItemDesc").value; 
    const postStatus = document.getElementById("postStatus");


    if (!name || !category || !location) {
      postStatus.innerText = "❌ Please fill all required fields";
      return;
    }
    
    // Disable button while processing
    const postItemBtn = document.getElementById("postItemBtn");
    postItemBtn.disabled = true;

    try {
        await addDoc(collection(db, "foundItems"), { 
            name,
            category,
            location,
            description: description || '',
            status: "Found",
            reportedBy: auth.currentUser.email,
            createdAt: serverTimestamp()
        });

        postStatus.innerText = "✅ Found item posted successfully!";

        document.getElementById("foundItemForm").reset(); // Reset form

        loadFoundItems(); // refresh list
    } catch (error) {
        postStatus.innerText = `❌ Error: ${error.message}`;
    } finally {
        postItemBtn.disabled = false;
    }
});

// ================= FOUND ITEMS LIST (Modified for Card UI and Claim Logic) =================
const itemsList = document.getElementById("itemsList");

async function loadFoundItems() {
    itemsList.innerHTML = "<p class='text-center'>Loading items...</p>";

    try {
        const q = query(
            collection(db, "foundItems"), 
            orderBy("createdAt", "desc")
        );

        // Found Items ka snapshot
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            itemsList.innerHTML = "<p class='text-center text-muted'>No items found yet. Be the first to post!</p>";
            return;
        }

        // Lost Items ka snapshot (Claim check ke liye pehle se fetch kar lete hain)
        const lostItemsSnapshot = await getDocs(collection(db, "lostItems"));
        const lostItemsData = lostItemsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        itemsList.innerHTML = "";

        snapshot.forEach((doc) => {
            const item = doc.data();
            const itemId = doc.id; 
            const date = item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';

            const card = document.createElement("div");
            card.className = 'col-md-6 col-lg-4 mb-4'; 
            
            card.innerHTML = `
                <div class="card h-100 shadow-sm border-warning">
                    <div class="card-body">
                        <h5 class="card-title text-warning">${item.name}</h5>
                        <p class="card-text mb-1"><strong>Category:</strong> ${item.category}</p>
                        <p class="card-text mb-1"><strong>Found Near:</strong> ${item.location}</p>
                        ${item.description ? `<p class="card-text small mb-1"><em>Desc: ${item.description.substring(0, 50)}...</em></p>` : ''}
                        <p class="card-text small text-muted">Posted by ${item.reportedBy || 'Unknown'} on ${date}</p>
                        <button class="btn btn-sm btn-outline-success mt-2 claim-btn" data-id="${itemId}">Claim This Item</button>
                    </div>
                </div>
            `;

            itemsList.appendChild(card);
        });
        
        // Add event listener for claim buttons (FINAL LOGIC)
        document.querySelectorAll('.claim-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (!auth.currentUser) {
                    alert("Please login to claim this item.");
                    return;
                }

                const foundItemId = e.target.dataset.id;
                const foundItemDoc = snapshot.docs.find(d => d.id === foundItemId);
                if (!foundItemDoc) return;
                
                const foundItemData = foundItemDoc.data();
                
                e.target.disabled = true;
                e.target.textContent = 'Matching...';

                // --- 🚀 AI MATCHING SIMULATION LOGIC ---
                
                let matchFound = false;

                for (const lostItem of lostItemsData) {
                    
                    // Step 1: Check basic conditions (status and category match)
                    if (lostItem.status === 'Lost' && lostItem.category === foundItemData.category) {
                        
                        // Step 2: Simulate advanced similarity check (using string search for demo)
                        const lostDesc = (lostItem.description || '').toLowerCase();
                        const foundName = foundItemData.name.toLowerCase();
                        const foundDesc = (foundItemData.description || '').toLowerCase();

                        // Match criteria 1: Name/desc overlap OR 
                        const isSimilar = lostDesc.includes(foundName) || foundName.includes(lostDesc) || lostDesc.includes(foundDesc);
                        
                        // Match criteria 2: Check if AI analysis has run and has specific data points (Yahan MOCK-AI 'Completed' dega)
                        const aiAnalysisDone = lostItem.analysis_status === 'Completed';

                        // Match criteria 3: Check Mock AI fields (Optional extra matching)
                        const mockAiMatch = lostItem.ai_color === foundItemData.ai_color || lostItem.ai_location === foundItemData.ai_location;


                        if (isSimilar || (aiAnalysisDone && mockAiMatch)) { // Modified condition
                            matchFound = true;
                            
                            alert(`🎉 **MATCH FOUND**! Your reported lost item (${lostItem.name}) seems to match this found item. 
                                \n---
                                \n**AUTOMATED NEXT STEP:** We have notified the item reporter (${foundItemData.reportedBy}) with your email (${auth.currentUser.email}) to arrange verification and handover.`);
                            
                            // Ek match milte hi ruk jao
                            break; 
                        }
                    }
                }

                // Step 3: Handle Match Result
                if (!matchFound) {
                    alert(`⚠️ **NO IMMEDIATE MATCH FOUND**. 
                        \n---
                        \nDon't worry! We have logged your claim request. The item reporter will be contacted to manually verify if the item belongs to you. Please wait for an email.`);
                }

                // Reset button
                e.target.disabled = false;
                e.target.textContent = 'Claim This Item';
            });
        });

    } catch (error) {
        itemsList.innerHTML = `<p class='text-danger'>Error loading items: ${error.message}</p>`;
        console.error("Error loading found items:", error);
    }
}

// Load items on page load
loadFoundItems(); 