// DawaDost Chatbot
// Supabase configuration is now in config.js

// Gemini requests go through a Netlify Function so the API key is never sent
// to a visitor's browser.
const GEMINI_PROXY_URL = '/.netlify/functions/gemini';

class DawaDost {
    constructor() {
        this.responses = {
            greetings: [
                "Hello! I'm DawaDost, your health assistant. How can I help you today?",
                "Hi there! DawaDost here. What can I do for you?",
                "Welcome! I'm DawaDost, ready to assist you with your health queries."
            ],
            farewell: [
                "Goodbye! Take care of your health!",
                "See you later! Stay healthy!",
                "Bye! Remember to take your medicines on time!"
            ],
            thanks: [
                "You're welcome!",
                "Glad I could help!",
                "Anytime! Feel free to ask more questions."
            ],
            default: [
                "I'm not sure about that. Could you rephrase your question?",
                "I don't have information on that yet. Try asking about medicines or health tips.",
                "I'm still learning. Could you try a different question?"
            ],
            stats: [
                "Here are your medicine statistics:",
                "Let me show you your medicine stats:",
                "Here's a summary of your medicines:"
            ],
            calendar: [
                "Here's your medicine calendar:",
                "Let me show you your medicine schedule:",
                "Here's your upcoming medicine reminders:"
            ],
            stocks: [
                "Here's the status of your medicine stocks:",
                "Let me check your medicine inventory:",
                "Here's what you have in stock:"
            ],
            healthTips: [
                "Here's a health tip for you:",
                "Let me share a health tip:",
                "Here's something good for your health:"
            ],
            dawatrack: [
                "DawaTrack is a comprehensive medicine management app that helps you track your medications, set reminders, and manage your health effectively.",
                "DawaTrack is your personal health assistant that helps you manage your medicines, track your health, and stay on top of your medication schedule.",
                "DawaTrack is a smart medicine management platform that combines medicine tracking, reminders, and health tips in one place."
            ]
        };

        // Initialize empty medicine info object - will be populated from Supabase
        this.medicineInfo = {};
        
        // Flag to track if medicines have been loaded
        this.medicinesLoaded = false;

        this.healthTips = [
            'Stay hydrated by drinking at least 8 glasses of water daily.',
            'Get 7-8 hours of sleep for optimal health.',
            'Exercise regularly to maintain good health.',
            'Wash your hands frequently to prevent infections.',
            'Eat a balanced diet rich in fruits and vegetables.',
            'Take medicines as prescribed and complete the full course.',
            'Store medicines in a cool, dry place away from direct sunlight.',
            'Keep a record of your medications and their schedules.',
            'Never share your prescription medicines with others.',
            'Regular health check-ups are important for preventive care.',
            'For heart health, try brisk walking for 30 minutes daily.',
            'Swimming is an excellent low-impact exercise for heart health.',
            'Cycling helps improve cardiovascular fitness and heart health.',
            'Practice yoga for stress reduction and heart health.',
            'Jump rope for 10-15 minutes daily to strengthen your heart.',
            'Try aerobic exercises like dancing for heart health.',
            'Climb stairs instead of using elevators for heart health.',
            'Do strength training exercises 2-3 times per week for heart health.',
            'Practice deep breathing exercises daily for heart health.',
            'Try interval training (alternating between high and low intensity) for heart health.'
        ];

        this.faqs = {
            'order': {
                question: 'How do I order medicines?',
                answer: 'You can order medicines in three ways:\n1. Browse our catalog and add items to cart\n2. Upload your prescription for prescription medicines\n3. Use the search bar to find specific medicines'
            },
            'prescription': {
                question: 'Do I need a prescription?',
                answer: 'Yes, for prescription medicines you need a valid prescription from a registered medical practitioner. For over-the-counter medicines, no prescription is required.'
            },
            'delivery': {
                question: 'How long does delivery take?',
                answer: 'We typically deliver within 24-48 hours. Delivery time may vary based on your location and medicine availability.'
            },
            'payment': {
                question: 'What payment methods do you accept?',
                answer: 'We accept various payment methods including:\n- Credit/Debit cards\n- UPI\n- Net banking\n- Cash on delivery'
            },
            'return': {
                question: 'What is your return policy?',
                answer: 'We accept returns within 7 days of delivery for unopened medicines. Prescription medicines cannot be returned once delivered.'
            },
            'stats': {
                question: 'How do I view my medicine statistics?',
                answer: 'You can view your medicine statistics by clicking on the "My Medicines" tab. This will show you how many medicines you have, which ones are expiring soon, and your active reminders.'
            },
            'calendar': {
                question: 'How do I manage my medicine reminders?',
                answer: 'You can manage your medicine reminders in the "Reminder Calendar" tab. There you can add, edit, or delete reminders for your medicines.'
            },
            'stocks': {
                question: 'How do I check my medicine stocks?',
                answer: 'You can check your medicine stocks in the "My Medicines" tab. This will show you all the medicines you have and their quantities.'
            },
            'healthTips': {
                question: 'How do I get health tips?',
                answer: 'You can ask me for health tips anytime. Just type "give me a health tip" or "health advice" and I\'ll share useful health information with you.'
            },
            'dawatrack': {
                question: 'What is DawaTrack?',
                answer: 'DawaTrack is a comprehensive medicine management app that helps you track your medications, set reminders, and manage your health effectively. It features medicine tracking, smart reminders, statistics, stock management, and health tips.'
            },
            'dawatrack_features': {
                question: 'What are the main features of DawaTrack?',
                answer: 'DawaTrack offers several key features:\n' +
                       '• Medicine Management: Track all your medicines\n' +
                       '• Smart Reminders: Never miss a dose\n' +
                       '• Medicine Statistics: Get usage insights\n' +
                       '• Stock Management: Track medicine inventory\n' +
                       '• Health Tips: Receive health advice\n' +
                       '• Profile Management: Store health information\n' +
                       '• Privacy Focused: Secure data storage'
            },
            'dawatrack_benefits': {
                question: 'What are the benefits of using DawaTrack?',
                answer: 'Using DawaTrack provides several benefits:\n' +
                       '• Improved medication adherence\n' +
                       '• Better health management\n' +
                       '• Reduced risk of missed doses\n' +
                       '• Easy tracking of medicine stocks\n' +
                       '• Personalized health insights\n' +
                       '• Secure health data storage'
            },
            'dawatrack_how': {
                question: 'How does DawaTrack work?',
                answer: 'DawaTrack works in simple steps:\n' +
                       '1. Add your medicines to the app\n' +
                       '2. Set up reminders for each medicine\n' +
                       '3. Track your medicine usage and stocks\n' +
                       '4. Receive health tips and advice\n' +
                       '5. Monitor your health progress'
            }
        };

        // Context tracking for conversation
        this.conversationContext = {
            lastTopic: null,
            lastMedicine: null,
            lastQuestion: null,
            userPreferences: {},
            conversationHistory: []
        };

        // Keywords for better understanding
        this.keywords = {
            health: ['health', 'sick', 'fever', 'pain', 'headache', 'cold', 'cough', 'infection', 'symptom'],
            order: ['order', 'buy', 'purchase', 'cart', 'checkout', 'payment', 'delivery', 'shipping'],
            prescription: ['prescription', 'doctor', 'prescribed', 'rx', 'medical', 'pharmacy'],
            general: ['what', 'how', 'when', 'where', 'why', 'can', 'should', 'would', 'could'],
            stats: ['statistics', 'stats', 'count', 'number', 'how many', 'summary', 'overview'],
            calendar: ['calendar', 'schedule', 'reminder', 'reminders', 'when', 'time', 'date', 'appointment'],
            stocks: ['stock', 'stocks', 'inventory', 'have', 'left', 'remaining', 'quantity', 'amount'],
            healthTips: ['health tip', 'health advice', 'wellness', 'healthy', 'lifestyle', 'diet', 'exercise'],
            dawatrack: ['dawatrack', 'app', 'application', 'platform', 'system', 'software']
        };

        // Response templates for dynamic generation
        this.responseTemplates = {
            healthAdvice: "Based on your symptoms of {symptoms}, I recommend {advice}. However, please consult a healthcare professional for proper diagnosis.",
            followUp: "Is there anything specific about {topic} you'd like to know more about?"
        };
        
        // Add user-specific data properties
        this.userData = {
            id: null,
            name: null,
            medicines: [],
            reminders: [],
            stats: {
                totalMedicines: 0,
                expiringMedicines: 0,
                activeReminders: 0
            }
        };
        
        // Initialize Supabase client
        this.supabaseClient = null;
        this.initializeSupabase();

        // Add context for Gemini
        this.geminiContext = {
            role: "You are DawaDost, a medical-focused health assistant. You should ONLY respond to medical and health-related queries. For any non-medical queries, respond with: 'I am a medical assistant and can only provide information related to health, medicines, and medical conditions. Please ask me about medical topics.'",
            examples: [
                {
                    input: "What is your name?",
                    output: "I'm DawaDost, your friendly health assistant! I'm here to help you manage your medicines and health better."
                },
                {
                    input: "How old are you?",
                    output: "I am a medical assistant and can only provide information related to health, medicines, and medical conditions. Please ask me about medical topics."
                },
                {
                    input: "What is the weather like?",
                    output: "I am a medical assistant and can only provide information related to health, medicines, and medical conditions. Please ask me about medical topics."
                }
            ]
        };

        // Add DawaTrack-specific information
        this.dawatrackInfo = {
            features: [
                "Medicine Management: Track all your medicines in one place",
                "Smart Reminders: Never miss a dose with intelligent reminders",
                "Medicine Statistics: Get insights about your medication usage",
                "Stock Management: Keep track of your medicine inventory",
                "Health Tips: Receive personalized health advice",
                "Profile Management: Store and manage your health information",
                "Privacy Focused: Your health data is always secure and private"
            ],
            benefits: [
                "Improved medication adherence",
                "Better health management",
                "Reduced risk of missed doses",
                "Easy tracking of medicine stocks",
                "Personalized health insights",
                "Secure health data storage"
            ],
            howItWorks: [
                "1. Add your medicines to the app",
                "2. Set up reminders for each medicine",
                "3. Track your medicine usage and stocks",
                "4. Receive health tips and advice",
                "5. Monitor your health progress"
            ]
        };

        // Add chat history properties
        this.chatHistory = [];
        this.maxHistoryLength = 50; // Maximum number of messages 50 is good enough for now
    
        
        // Add chat history methods
        this.saveChatHistory = this.saveChatHistory.bind(this);
        this.loadChatHistory = this.loadChatHistory.bind(this);
        this.clearChatHistory = this.clearChatHistory.bind(this);
        
        // Load chat history on initialization
        this.loadChatHistory();

        this.lastRequestTime = 0;
        this.requestCooldown = 1000; // 1 second cooldown between requests
        this.maxRetries = 3;
        this.retryDelay = 1000; // Initial retry delay in milliseconds

        // Add medical-specific keywords
        this.medicalKeywords = {
            symptoms: ['symptom', 'pain', 'ache', 'fever', 'cough', 'cold', 'headache', 'nausea', 'dizziness', 'fatigue'],
            conditions: ['disease', 'condition', 'illness', 'infection', 'disorder', 'syndrome'],
            medicines: ['medicine', 'medication', 'drug', 'pill', 'tablet', 'capsule', 'syrup', 'injection', 'vaccine'],
            treatments: ['treatment', 'therapy', 'cure', 'remedy', 'prescription', 'dosage'],
            health: ['health', 'medical', 'doctor', 'hospital', 'clinic', 'pharmacy', 'healthcare'],
            body: ['body', 'organ', 'tissue', 'blood', 'heart', 'lung', 'liver', 'kidney', 'brain']
        };

        // Add function to check if query is medical-related
        this.isMedicalQuery = function(input) {
            const lowerInput = input.toLowerCase();
            for (const category in this.medicalKeywords) {
                if (this.medicalKeywords[category].some(keyword => lowerInput.includes(keyword))) {
                    return true;
                }
            }
            return false;
        };

        // Add medicine dataset properties
        this.medicineDataset = null;
        this.datasetLoaded = false;

        // Add method to load medicine dataset
        this.loadMedicineDataset().catch(error => {
            console.error('Failed to load medicine dataset:', error);
        });

        // Add method to parse CSV
        this.parseCSV = this.parseCSV.bind(this);

        // Add method to search medicine dataset
        this.searchMedicineDataset = this.searchMedicineDataset.bind(this);

        // Add method to format medicine response
        this.formatMedicineResponse = this.formatMedicineResponse.bind(this);

        // Add method to process user input
        this.processInput = this.processInput.bind(this);
    }
    
    // Initialize Supabase client
    initializeSupabase() {
        if (typeof window.supabase !== 'undefined' && window.SUPABASE_CONFIG) {
            this.supabaseClient = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );
            console.log('Supabase client initialized');
        } else {
            console.error('Supabase client or configuration not available');
        }
    }
    
    // Get current user ID
    async getCurrentUserId() {
        try {
            if (!this.supabaseClient) {
                this.initializeSupabase();
            }
            
            const { data: { session } } = await this.supabaseClient.auth.getSession();
            if (session && session.user) {
                return session.user.id;
            }
            return null;
        } catch (error) {
            console.error('Error getting current user ID:', error);
            return null;
        }
    }
    
    // Helper function to calculate days until a date
    getDaysUntil(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);
        return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
    }
    
    // Load user data from Supabase
    async loadUserData() {
        try {
            const userId = await this.getCurrentUserId();
            if (!userId) {
                console.log('No user logged in');
                return false;
            }

            this.userData.id = userId;

            // Fetch user profile data
            const { data: profileData, error: profileError } = await this.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // Ignore "not found" error
                console.error('Error fetching profile data:', profileError);
                return false;
            }

            // Store user profile data
            if (profileData) {
                this.userData.name = profileData.name || profileData.full_name || 'User';
                this.userData.age = profileData.age;
                this.userData.gender = profileData.gender;
                this.userData.email = profileData.email;
                this.userData.mobile = profileData.mobile;
                this.userData.emergency_mobile = profileData.emergency_mobile;
            } else {
                // If no profile data, try to get name from auth metadata
                const { data: { user }, error: userError } = await this.supabaseClient.auth.getUser();
                if (!userError && user && user.user_metadata) {
                    this.userData.name = user.user_metadata.full_name || 'User';
                    this.userData.email = user.email;
                } else {
                    this.userData.name = 'User';
                }
            }

            // Set date filters
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            const thirtyDaysFromNow = new Date(today);
            thirtyDaysFromNow.setDate(today.getDate() + 30);

            // Fetch prescriptions
            const { data: prescriptionsData, error: prescriptionsError } = await this.supabaseClient
                .from('prescriptions')
                .select('*')
                .eq('user_id', userId);

            if (prescriptionsError) {
                console.error('Error fetching prescriptions:', prescriptionsError);
                return false;
            }

            // Fetch prescription medicines
            const { data: prescriptionMedicinesData, error: prescriptionMedicinesError } = await this.supabaseClient
                .from('prescription_medicines')
                .select('*')
                .in('prescription_id', prescriptionsData.map(p => p.id));

            if (prescriptionMedicinesError) {
                console.error('Error fetching prescription medicines:', prescriptionMedicinesError);
                return false;
            }

            // Fetch medicine expiry data
            const { data: expiryData, error: expiryError } = await this.supabaseClient
                .from('medicine_expiry')
                .select('*')
                .eq('user_id', userId)
                .gte('expiry_date', today.toISOString())
                .lte('expiry_date', thirtyDaysFromNow.toISOString());

            if (expiryError) {
                console.error('Error fetching expiry data:', expiryError);
                return false;
            }

            // Fetch checkup data
            const { data: checkupData, error: checkupError } = await this.supabaseClient
                .from('checkup')
                .select('*')
                .eq('user_id', userId)
                .gte('appointment_datetime', today.toISOString())
                .lte('appointment_datetime', thirtyDaysFromNow.toISOString());

            if (checkupError) {
                console.error('Error fetching checkup data:', checkupError);
                return false;
            }

            // Fetch medicine stock data
            const { data: medicineStockData, error: medicineStockError } = await this.supabaseClient
                .from('medicines')
                .select('*')
                .eq('user_id', userId);

            if (medicineStockError) {
                console.error('Error fetching medicine stock data:', medicineStockError);
                return false;
            }

            // Store the fetched data
            this.userData.medicines = medicineStockData || [];
            this.userData.prescriptionMedicines = prescriptionMedicinesData || [];
            this.userData.expiry = expiryData || [];
            this.userData.checkups = checkupData || [];
            
            // Calculate stats
            this.userData.stats = this.calculateMedicineStats();
            
            console.log('User data loaded successfully:', {
                name: this.userData.name,
                medicines: this.userData.medicines.length,
                prescriptionMedicines: this.userData.prescriptionMedicines.length,
                expiry: this.userData.expiry.length,
                checkups: this.userData.checkups.length
            });
            
            return true;
        } catch (error) {
            console.error('Error loading user data:', error);
            return false;
        }
    }

    calculateMedicineStats() {
        if (!this.userData) {
            return {
                totalMedicines: 0,
                expiringMedicines: 0,
                upcomingCheckups: 0,
                dailyTimeSlots: 0
            };
        }

        const today = new Date();
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        // Calculate total active medicines
        const totalMedicines = this.userData.medicines.length;

        // Calculate medicines expiring in next 7 days
        const expiringMedicines = this.userData.expiry.filter(medicine => {
            const expiryDate = new Date(medicine.expiry_date);
            return expiryDate <= sevenDaysFromNow && expiryDate >= today;
        }).length;

        // Calculate unique daily time slots
        const timeSlots = new Set();
        this.userData.medicines.forEach(medicine => {
            if (medicine.time_to_take) {
                timeSlots.add(medicine.time_to_take);
            }
        });

        // Calculate upcoming checkups in next 30 days
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        const upcomingCheckups = this.userData.checkups.filter(checkup => {
            const appointmentDate = new Date(checkup.appointment_datetime);
            return appointmentDate <= thirtyDaysFromNow && appointmentDate >= today;
        }).length;

        return {
            totalMedicines,
            expiringMedicines,
            upcomingCheckups,
            dailyTimeSlots: timeSlots.size
        };
    }

    // Save chat history to localStorage
    saveChatHistory() {
        try {
            localStorage.setItem('dawadost_chat_history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    // Load chat history from localStorage
    loadChatHistory() {
        try {
            const savedHistory = localStorage.getItem('dawadost_chat_history');
            if (savedHistory) {
                this.chatHistory = JSON.parse(savedHistory);
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    // Clear chat history
    clearChatHistory() {
        this.chatHistory = [];
        this.saveChatHistory();
    }

    // Add message to chat history
    addToHistory(message, isUser) {
        const timestamp = new Date().toISOString();
        this.chatHistory.push({
            message,
            isUser,
            timestamp
        });

        // Keep only the last maxHistoryLength messages
        if (this.chatHistory.length > this.maxHistoryLength) {
            this.chatHistory = this.chatHistory.slice(-this.maxHistoryLength);
        }

        this.saveChatHistory();
    }

    // Get chat history
    getChatHistory() {
        return this.chatHistory.map(entry => ({
            ...entry,
            formattedTime: new Date(entry.timestamp).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            })
        }));
    }

    // Add method to load medicine dataset
    async loadMedicineDataset() {
        try {
            const response = await fetch('new_medicine_dataset (1).csv');
            const csvText = await response.text();
            this.medicineDataset = this.parseCSV(csvText);
            this.datasetLoaded = true;
            console.log('Medicine dataset loaded successfully');
        } catch (error) {
            console.error('Error loading medicine dataset:', error);
            this.datasetLoaded = false;
        }
    }

    // Add method to parse CSV
    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        const dataset = [];

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',');
            const entry = {};
            headers.forEach((header, index) => {
                entry[header.trim()] = values[index]?.trim() || '';
            });
            dataset.push(entry);
        }
        return dataset;
    }

    // Add method to search medicine dataset
    searchMedicineDataset(query) {
        if (!this.datasetLoaded || !this.medicineDataset) {
            return null;
        }

        const lowerQuery = query.toLowerCase();
        return this.medicineDataset.filter(medicine => {
            return Object.values(medicine).some(value => 
                value.toLowerCase().includes(lowerQuery)
            );
        });
    }

    // Add method to format medicine response
    formatMedicineResponse(medicine) {
        let response = "Here's what I found about this medicine:\n\n";
        
        // Add each field from the medicine data
        for (const [key, value] of Object.entries(medicine)) {
            if (value && value.trim()) {
                response += `${key}: ${value}\n`;
            }
        }

        response += "\nPlease note: This information is for reference only. Always consult your healthcare provider before taking any medicine.";
        return response;
    }

    // Process user input and generate response
    async processInput(input) {
        if (!this.isMedicalQuery(input)) {
            return "I am a medical assistant and can only provide information related to health, medicines, and medical conditions. Please ask me about medical topics.";
        }

        // Search in medicine dataset first
        if (this.datasetLoaded) {
            const medicineResults = this.searchMedicineDataset(input);
            if (medicineResults && medicineResults.length > 0) {
                // Format medicine information
                const response = this.formatMedicineResponse(medicineResults[0]);
                return response;
            }
        }

        // If no match in dataset, proceed with existing logic
        input = input.toLowerCase().trim();
        
        // First check for DawaTrack queries
        if (this.isDawaTrackQuery(input)) {
            return this.generateDawaTrackResponse(input);
        }
        
        // First check for bot-related questions
        if (input.includes('your') || input.includes('you') || input.includes('yours') || 
            input.includes('yourself') || input.includes('yourselves')) {
            try {
                return await this.generateGeminiResponse(input);
            } catch (error) {
                console.error('Error generating Gemini response:', error);
                return "I'm having trouble processing your request right now. Please try again later.";
            }
        }
        
        // Then check for user profile data
        if (this.isProfileQuery(input)) {
            return this.generateProfileResponse();
        }

        // Load user data before processing stats, calendar, or stocks queries
        await this.loadUserData();

        // Check for stats-related queries
        if (this.isStatsQuery(input)) {
            return this.generateStatsResponse();
        }

        // Check for calendar-related queries
        if (this.isCalendarQuery(input)) {
            return await this.generateCalendarResponse();
        }

        // Check for stocks-related queries
        if (this.isStocksQuery(input)) {
            return this.generateStocksResponse();
        }

        // Check for health tips queries
        if (this.isHealthTipsQuery(input)) {
            return this.generateHealthTipsResponse();
        }

        // Check for medicine library queries
        if (input.includes('medicine library') || input.includes('medicines library') || 
            input.includes('library of medicines') || input.includes('list of medicines') ||
            input.includes('medicine information') || input.includes('medicine details') ||
            input.includes('about medicines') || input.includes('medicine guide')) {
            return "You can find detailed information about medicines, including their uses, side effects, and precautions in our comprehensive medicine library. <a href='https://dawatrack.netlify.app/medicine_library' style='color: var(--primary-color, #00b6db); text-decoration: underline;'>Click here</a> to access the medicine library and search for specific medicines.";
        }

        // Check for FAQ queries
        const faqResponse = this.checkForFAQ(input);
        if (faqResponse) {
            return faqResponse;
        }

        // Use Gemini API for all other queries
        try {
            return await this.generateGeminiResponse(input);
        } catch (error) {
            console.error('Error generating Gemini response:', error);
            return "I'm having trouble processing your request right now. Please try again later.";
        }
    }

    async generateGeminiResponse(input) {
        // Check rate limiting
        const now = Date.now();
        if (now - this.lastRequestTime < this.requestCooldown) {
            await new Promise(resolve => setTimeout(resolve, this.requestCooldown - (now - this.lastRequestTime)));
        }

        let retryCount = 0;
        while (retryCount < this.maxRetries) {
            try {
                this.lastRequestTime = Date.now();
                const response = await fetch(GEMINI_PROXY_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ input })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    if (response.status === 429) {
                        // Rate limit exceeded
                        const retryAfter = response.headers.get('Retry-After') || this.retryDelay * Math.pow(2, retryCount);
                        await new Promise(resolve => setTimeout(resolve, retryAfter));
                        retryCount++;
                        continue;
                    }
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error?.message || 'Unknown error'}`);
                }

                const data = await response.json();
                
                if (data.text) {
                    // Format the response for better readability
                    let formattedResponse = data.text;
                    
                    // Remove asterisks and replace with proper HTML tags
                    formattedResponse = formattedResponse.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    formattedResponse = formattedResponse.replace(/\*(.*?)\*/g, '<em>$1</em>');
                    
                    // Add line breaks after periods and question marks
                    formattedResponse = formattedResponse.replace(/\. /g, '.\n\n');
                    formattedResponse = formattedResponse.replace(/\? /g, '?\n\n');
                    
                    // Add line breaks after colons
                    formattedResponse = formattedResponse.replace(/: /g, ':\n\n');
                    
                    // Add line breaks after bullet points
                    formattedResponse = formattedResponse.replace(/• /g, '\n• ');
                    
                    // Add line breaks after numbers followed by periods
                    formattedResponse = formattedResponse.replace(/(\d+)\. /g, '$1.\n\n');
                    
                    // Add line breaks after emojis
                    formattedResponse = formattedResponse.replace(/([\u{1F300}-\u{1F9FF}])/gu, '$1\n\n');
                    
                    // Remove any double line breaks
                    formattedResponse = formattedResponse.replace(/\n\n\n/g, '\n\n');
                    
                    // Convert to HTML for proper rendering
                    formattedResponse = formattedResponse.replace(/\n/g, '<br>');
                    
                    return formattedResponse;
                } else if (data.error) {
                    throw new Error(`Gemini API Error: ${data.error}`);
                } else {
                    throw new Error('Invalid response format from Gemini API');
                }
            } catch (error) {
                console.error('Error calling Gemini API:', error);
                if (retryCount < this.maxRetries - 1) {
                    const delay = this.retryDelay * Math.pow(2, retryCount);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    retryCount++;
                    continue;
                }
                
                // If all retries failed, return a fallback response
                return this.getFallbackResponse(input);
            }
        }
        
        // If we get here, all retries failed
        return this.getFallbackResponse(input);
    }

    getFallbackResponse(input) {
        // Provide a fallback response when the API is unavailable
        if (this.isGreeting(input)) {
            return this.getRandomResponse(this.responses.greetings);
        } else if (this.isFarewell(input)) {
            return this.getRandomResponse(this.responses.farewell);
        } else if (this.isThanks(input)) {
            return "You're welcome! I'm here to help.";
        } else if (this.isStatsQuery(input)) {
            return this.generateStatsResponse();
        } else if (this.isCalendarQuery(input)) {
            return this.generateCalendarResponse();
        } else if (this.isStocksQuery(input)) {
            return this.generateStocksResponse();
        } else if (this.isHealthTipsQuery(input)) {
            return this.generateHealthTipsResponse();
        } else if (this.isProfileQuery(input)) {
            return this.generateProfileResponse();
        } else if (this.isDawaTrackQuery(input)) {
            return this.generateDawaTrackResponse(input);
        } else {
            return "I apologize, but I'm currently experiencing some technical difficulties. Please try again in a few moments or rephrase your question.";
        }
    }

    // Helper methods
    isGreeting(input) {
        const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
        return greetings.some(greeting => input.includes(greeting));
    }
    
    isFarewell(input) {
        const farewells = ['bye', 'goodbye', 'see you', 'farewell'];
        return farewells.some(farewell => input.includes(farewell));
    }
    
    isThanks(input) {
        const thanks = ['thank', 'thanks', 'appreciate'];
        return thanks.some(thank => input.includes(thank));
    }
    
    getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Helper methods for query detection
    isStatsQuery(input) {
        return input.toLowerCase().includes('stats') || 
               input.toLowerCase().includes('statistics') || 
               input.toLowerCase().includes('medicine count') ||
               input.toLowerCase().includes('medicine summary');
    }

    isCalendarQuery(input) {
        return input.toLowerCase().includes('calendar') || 
               input.toLowerCase().includes('schedule') || 
               input.toLowerCase().includes('reminders') ||
               input.toLowerCase().includes('when to take');
    }

    isStocksQuery(input) {
        return input.toLowerCase().includes('stocks') || 
               input.toLowerCase().includes('inventory') || 
               input.toLowerCase().includes('quantity') ||
               input.toLowerCase().includes('medicine left');
    }

    isHealthTipsQuery(input) {
        return input.toLowerCase().includes('health tips') || 
               input.toLowerCase().includes('health advice') || 
               input.toLowerCase().includes('wellness tips') ||
               input.toLowerCase().includes('healthy living tips');
    }

    isProfileQuery(input) {
        return input.toLowerCase().includes('my profile') || 
               input.toLowerCase().includes('profile info') || 
               input.toLowerCase().includes('profile information') ||
               input.toLowerCase().includes('my information');
    }

    // Add method to check for DawaTrack queries
    isDawaTrackQuery(input) {
        return input.toLowerCase().includes('dawatrack') || 
               input.toLowerCase().includes('app') || 
               input.toLowerCase().includes('application') ||
               input.toLowerCase().includes('platform') ||
               input.toLowerCase().includes('system') ||
               input.toLowerCase().includes('software');
    }

    // Add method to generate DawaTrack responses
    generateDawaTrackResponse(input) {
        if (input.includes('feature') || input.includes('what can') || input.includes('capability')) {
            return this.faqs.dawatrack_features.answer + 
                   `\n\n<a href="/features" style="color: var(--primary-color, #00b6db); text-decoration: underline;">Learn more about our features</a>`;
        } else if (input.includes('benefit') || input.includes('advantage') || input.includes('help')) {
            return this.faqs.dawatrack_benefits.answer + 
                   `\n\n<a href="/benefits" style="color: var(--primary-color, #00b6db); text-decoration: underline;">Discover more benefits</a>`;
        } else if (input.includes('how') || input.includes('work') || input.includes('use')) {
            return this.faqs.dawatrack_how.answer + 
                   `\n\n<a href="/how-it-works" style="color: var(--primary-color, #00b6db); text-decoration: underline;">See detailed guide</a>`;
        } else {
            return this.faqs.dawatrack.answer + 
                   `\n\n<a href="/about" style="color: var(--primary-color, #00b6db); text-decoration: underline;">Learn more about DawaTrack</a>`;
        }
    }

    generateProfileResponse() {
        if (!this.userData) {
            return "I'm sorry, but I don't have your profile information available at the moment. Please try again later.";
        }

        let response = "👤 Your Profile Information:\n\n";
        if (this.userData.name) response += `• Name: ${this.userData.name}\n`;
        if (this.userData.age) response += `• Age: ${this.userData.age}\n`;
        if (this.userData.gender) response += `• Gender: ${this.userData.gender}\n`;
        if (this.userData.email) response += `• Email: ${this.userData.email}\n`;
        if (this.userData.mobile) response += `• Mobile: ${this.userData.mobile}\n`;
        if (this.userData.emergency_mobile) response += `• Emergency Contact: ${this.userData.emergency_mobile}\n`;

        response += `\n<a href="/profile" style="color: var(--primary-color, #00b6db); text-decoration: underline;">Update your profile information</a>`;

        return response;
    }

    // Generate responses for different query types
    generateStatsResponse() {
        if (!this.userData || !this.userData.stats) {
            return "I'm sorry, but I don't have any statistics available at the moment. Please try again later.";
        }

        const stats = this.userData.stats;
        const responses = [
            `📊 Your Medicine Statistics:\n\n` +
            `• Total Active Medicines: ${stats.totalMedicines}\n` +
            `• Medicines Expiring Soon: ${stats.expiringMedicines} (next 7 days)\n` +
            `• Upcoming Checkups: ${stats.upcomingCheckups} (next 30 days)\n` +
            `• Daily Medicine Times: ${stats.dailyTimeSlots} time slots\n\n` +
            `For more detailed statistics, <a href="https://dawatrack.netlify.app/charts" style="color: var(--primary-color, #00b6db); text-decoration: underline;">click here</a> to view your medicine dashboard.`,

            `📈 Here's a summary of your medicines:\n\n` +
            `• Active Medicines: ${stats.totalMedicines}\n` +
            `• Expiring Soon: ${stats.expiringMedicines} (within 7 days)\n` +
            `• Upcoming Checkups: ${stats.upcomingCheckups} (within 30 days)\n` +
            `• Daily Time Slots: ${stats.dailyTimeSlots}\n\n` +
            `For more detailed statistics, <a href="https://dawatrack.netlify.app/charts" style="color: var(--primary-color, #00b6db); text-decoration: underline;">click here</a> to view your medicine dashboard.`,

            `🔍 Let me check your medicine statistics...\n\n` +
            `• Total Medicines: ${stats.totalMedicines}\n` +
            `• Expiring in 7 days: ${stats.expiringMedicines}\n` +
            `• Checkups in 30 days: ${stats.upcomingCheckups}\n` +
            `• Medicine Times: ${stats.dailyTimeSlots}\n\n` +
            `For more detailed statistics, <a href="https://dawatrack.netlify.app/charts" style="color: var(--primary-color, #00b6db); text-decoration: underline;">click here</a> to view your medicine dashboard.`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    async generateCalendarResponse() {
        if (!this.userData) {
            return "I'm sorry, but I don't have any calendar information available at the moment. Please try again later.";
        }

        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all prescription reminders
        const prescriptionReminders = [];
        this.userData.medicines.forEach(medicine => {
            if (medicine.time_to_take && medicine.frequency) {
                // Handle multiple reminders based on frequency
                const times = medicine.frequency.toLowerCase().includes('once') ? 1 : 
                             medicine.frequency.toLowerCase().includes('twice') ? 2 : 
                             medicine.frequency.toLowerCase().includes('thrice') ? 3 : 1;
                
                medicine.time_to_take.split(',').forEach(time => {
                    const [hours, minutes] = time.trim().split(':');
                    if (!isNaN(hours) && !isNaN(minutes)) {
                        const reminderTime = new Date(today);
                        reminderTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                        prescriptionReminders.push({
                            type: 'prescription',
                            title: `Take ${medicine.medicine_name}`,
                            time: reminderTime,
                            details: `Take ${medicine.dosage} ${medicine.frequency}`
                        });
                    }
                });
            }
        });

        // Get expiry reminders for next 7 days
        const expiryReminders = this.userData.expiry
            .filter(med => {
                const daysUntil = this.getDaysUntil(med.expiry_date);
                return daysUntil >= 0 && daysUntil <= 7;
            })
            .map(med => ({
                type: 'expiry',
                title: `${med.medicine_name} Expiry`,
                date: new Date(med.expiry_date),
                details: `Medicine will expire soon`
            }));

        // Get upcoming checkups for next 30 days
        const checkupReminders = this.userData.checkups
            .filter(checkup => {
                const daysUntil = this.getDaysUntil(checkup.appointment_datetime);
                return daysUntil >= 0 && daysUntil <= 30;
            })
            .map(checkup => ({
                type: 'checkup',
                title: `Checkup with Dr. ${checkup.doctor_name}`,
                date: new Date(checkup.appointment_datetime),
                details: `At ${checkup.clinic_location}`
            }));

        // Combine all reminders
        const allReminders = [
            ...prescriptionReminders,
            ...expiryReminders,
            ...checkupReminders
        ].sort((a, b) => (a.time || a.date).getTime() - (b.time || b.date).getTime());

        if (allReminders.length === 0) {
            return "You don't have any upcoming reminders at the moment. <a href='https://dawatrack.netlify.app/reminder_calendar' style='color: var(--primary-color, #00b6db); text-decoration: underline;'>Click here</a> to view your full calendar.";
        }

        // Format the response
        const responses = [
            `📅 Your Upcoming Reminders:\n\n` +
            allReminders.map(reminder => {
                const dateTime = reminder.time || reminder.date;
                const timeStr = dateTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                const dateStr = dateTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
                const icon = reminder.type === 'prescription' ? '💊' : 
                            reminder.type === 'expiry' ? '⚠️' : '🏥';
                return `${icon} ${reminder.title}\n   📅 ${dateStr} at ${timeStr}\n   ℹ️ ${reminder.details}`;
            }).join('\n\n') + `\n\n<a href='https://dawatrack.netlify.app/reminder_calendar' style='color: var(--primary-color, #00b6db); text-decoration: underline;'>View full calendar</a>`,

            `🗓️ Here are your scheduled reminders:\n\n` +
            allReminders.map(reminder => {
                const dateTime = reminder.time || reminder.date;
                const timeStr = dateTime.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                });
                const dateStr = dateTime.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
                const icon = reminder.type === 'prescription' ? '💊' : 
                            reminder.type === 'expiry' ? '⚠️' : '🏥';
                return `${icon} ${dateStr} ${timeStr}\n   ${reminder.title}\n   ℹ️ ${reminder.details}`;
            }).join('\n\n') + `\n\n<a href='https://dawatrack.netlify.app/reminder_calendar' style='color: var(--primary-color, #00b6db); text-decoration: underline;'>View full calendar</a>`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    generateStocksResponse() {
        if (!this.userData || !this.userData.medicines) {
            return "I'm sorry, but I don't have any stock information available at the moment. Please try again later.";
        }

        const medicines = this.userData.medicines;
        const criticalStock = medicines.filter(m => m.current_stock <= m.minimum_stock);
        const lowStock = medicines.filter(m => m.current_stock > m.minimum_stock && (m.current_stock / m.minimum_stock) <= 2);
        const goodStock = medicines.filter(m => (m.current_stock / m.minimum_stock) > 2);

        let response = "📊 Medicine Stock Status\n\n";

        if (criticalStock.length > 0) {
            response += "🔴 Critical Stock (Need immediate attention):\n";
            criticalStock.forEach(medicine => {
                response += `• ${medicine.name}\n   Stock: ${medicine.current_stock}/${medicine.minimum_stock} units\n\n`;
            });
        }

        if (lowStock.length > 0) {
            response += "🟡 Low Stock:\n";
            lowStock.forEach(medicine => {
                response += `• ${medicine.name}\n   Stock: ${medicine.current_stock}/${medicine.minimum_stock} units\n\n`;
            });
        }

        if (goodStock.length > 0) {
            response += "🟢 Good Stock:\n";
            goodStock.forEach(medicine => {
                response += `• ${medicine.name}\n   Stock: ${medicine.current_stock}/${medicine.minimum_stock} units\n\n`;
            });
        }

        // Add Summary
        response += "📋 Summary:\n";
        if (criticalStock.length > 0) {
            response += `• ${criticalStock.length} medicine(s) need immediate restock\n`;
        }
        if (lowStock.length > 0) {
            response += `• ${lowStock.length} medicine(s) running low\n`;
        }
        if (goodStock.length > 0) {
            response += `• ${goodStock.length} medicine(s) in good stock\n`;
        }

        response += `\n<a href="https://dawatrack.netlify.app/my_medicines" style="color: var(--primary-color, #00b6db); text-decoration: underline;">View detailed stock information</a>`;

        return response;
    }

    generateHealthTipsResponse() {
        const randomTip = this.healthTips[Math.floor(Math.random() * this.healthTips.length)];
        return this.getRandomResponse(this.responses.healthTips) + "\n\n" + randomTip + 
               `\n\n<a href="https://dawatrack.netlify.app/health_tips" style="color: var(--primary-color, #00b6db); text-decoration: underline;">View more health tips</a>`;
    }

    // Check for FAQ queries
    checkForFAQ(input) {
        const faqKeywords = {
            order: ['order', 'buy', 'purchase', 'cart', 'checkout'],
            prescription: ['prescription', 'doctor', 'prescribed', 'rx'],
            delivery: ['delivery', 'shipping', 'when will', 'arrive'],
            payment: ['payment', 'pay', 'card', 'upi', 'cash'],
            return: ['return', 'refund', 'exchange'],
            stats: ['statistics', 'stats', 'medicine count'],
            calendar: ['reminder', 'schedule', 'when to take'],
            stocks: ['inventory', 'stock level', 'quantity'],
            healthTips: ['health tip', 'health advice', 'wellness']
        };

        // Check if the input matches any FAQ keywords
        for (const key in this.faqs) {
            const faq = this.faqs[key];
            const keywords = faqKeywords[key] || [];
            
            if (input.includes(faq.question.toLowerCase()) || 
                keywords.some(keyword => input.includes(keyword))) {
                return faq.answer;
            }
        }
        
        return null;
    }

    generateGreetingResponse() {
        const hour = new Date().getHours();
        let greeting;
        
        if (hour < 12) {
            greeting = "Good morning";
        } else if (hour < 17) {
            greeting = "Good afternoon";
        } else {
            greeting = "Good evening";
        }

        // If we have the user's name, use it in the greeting
        if (this.userData && this.userData.name) {
            const responses = [
                `${greeting}, ${this.userData.name}! I'm DawaDost, your health assistant. How can I help you today?`,
                `${greeting}, ${this.userData.name}! I'm here to help you manage your health. What would you like to know?`,
                `${greeting}, ${this.userData.name}! I'm your personal health assistant. How may I assist you today?`
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // Default responses without name
        const responses = [
            `${greeting}! I'm DawaDost, your health assistant. How can I help you today?`,
            `${greeting}! I'm here to help you manage your health. What would you like to know?`,
            `${greeting}! I'm your personal health assistant. How may I assist you today?`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// Export the DawaDost class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DawaDost;
}

// Create and initialize the chat widget
document.addEventListener('DOMContentLoaded', function() {
    // Create the chat button
    const chatButton = document.createElement('div');
    chatButton.className = 'dawadost-chat-button';
    chatButton.innerHTML = '<i class="fas fa-comment-dots"></i>';
    chatButton.title = 'Chat with DawaDost';
    document.body.appendChild(chatButton);

    // Create the chat modal
    const chatModal = document.createElement('div');
    chatModal.className = 'dawadost-chat-modal';
    chatModal.innerHTML = `
        <div class="dawadost-chat-header">
            <div class="dawadost-chat-title">
                <div class="dawadost-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div>
                    <h3>DawaDost</h3>
                    <p>Your Health Assistant</p>
                </div>
            </div>
            <button class="dawadost-history-button" title="View Chat History">
                <i class="fas fa-history"></i>
            </button>
            <button class="dawadost-close-button">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="dawadost-chat-messages" id="dawadostChatMessages">
            <div class="dawadost-date-display">
                <span class="dawadost-date-text"></span>
            </div>
            <!-- Messages will be added here -->
        </div>
        <div class="dawadost-chat-input-container">
            <input type="text" class="dawadost-chat-input" id="dawadostChatInput" placeholder="Type your message here...">
            <button class="dawadost-send-button">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;
    document.body.appendChild(chatModal);

    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        .dawadost-chat-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background-color: var(--primary-color, #00b6db);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            animation: popIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .dawadost-chat-button:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        
        .dawadost-chat-button:active {
            transform: scale(0.95);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .dawadost-chat-button i {
            font-size: 20px;
            transition: transform 0.3s ease;
        }
        
        .dawadost-chat-button:hover i {
            transform: scale(1.1);
        }
        
        @keyframes popIn {
            0% {
                transform: scale(0);
                opacity: 0;
            }
            50% {
                transform: scale(1.2);
                opacity: 0.8;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .dawadost-chat-modal {
            position: fixed;
            bottom: 90px;
            right: 20px;
            width: 350px;
            height: 500px;
            background-color: var(--card-bg, #ffffff);
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            display: none;
            flex-direction: column;
            z-index: 1000;
            overflow: hidden;
            transform-origin: bottom right;
            animation: modalPopIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes modalPopIn {
            0% {
                transform: scale(0.8);
                opacity: 0;
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }
        
        .dawadost-chat-modal.active {
            display: flex;
        }
        
        .dawadost-chat-header {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background-color: var(--primary-color, #00b6db);
            color: white;
        }
        
        .dawadost-chat-title {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .dawadost-avatar {
            width: 40px;
            height: 40px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .dawadost-chat-title h3 {
            margin: 0;
            font-size: 16px;
        }
        
        .dawadost-chat-title p {
            margin: 0;
            font-size: 12px;
            opacity: 0.8;
        }
        
        .dawadost-close-button {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
        }
        
        .dawadost-chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background-color: var(--input-bg, #f5f5f5);
        }
        
        .dawadost-message {
            margin-bottom: 15px;
            display: flex;
            flex-direction: column;
        }
        
        .dawadost-message-content {
            max-width: 80%;
            padding: 10px 12px;
            border-radius: 18px;
            line-height: 1.4;
            font-size: 14px;
        }
        
        .dawadost-user-message {
            align-items: flex-end;
        }
        
        .dawadost-user-message .dawadost-message-content {
            background-color: var(--primary-color, #00b6db);
            color: white;
            border-bottom-right-radius: 4px;
        }
        
        .dawadost-bot-message {
            align-items: flex-start;
        }
        
        .dawadost-bot-message .dawadost-message-content {
            background-color: var(--card-bg, #ffffff);
            color: var(--text-color, #333333);
            border-bottom-left-radius: 4px;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: default;
            user-select: text;
        }
        
        .dawadost-message-time {
            font-size: 0.7rem;
            color: var(--text-color, #333333);
            opacity: 0.5;
            margin-top: 5px;
        }
        
        .dawadost-suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 10px 15px;
            background-color: var(--card-bg, #ffffff);
            border-top: 1px solid var(--border-color, #e0e0e0);
        }
        
        .dawadost-suggestion-chip {
            background-color: var(--input-bg, #f5f5f5);
            color: var(--text-color, #333333);
            padding: 6px 12px;
            border-radius: 16px;
            font-size: 12px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        
        .dawadost-suggestion-chip:hover {
            background-color: var(--border-color, #e0e0e0);
        }
        
        .dawadost-chat-input-container {
            display: flex;
            gap: 8px;
            padding: 10px 15px;
            background-color: var(--card-bg, #ffffff);
            border-top: 1px solid var(--border-color, #e0e0e0);
        }
        
        .dawadost-chat-input {
            flex: 1;
            padding: 8px 12px;
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 20px;
            background-color: var(--input-bg, #f5f5f5);
            color: var(--text-color, #333333);
            font-size: 14px;
        }
        
        .dawadost-chat-input:focus {
            outline: none;
            border-color: var(--primary-color, #00b6db);
        }
        
        .dawadost-send-button {
            background-color: var(--primary-color, #00b6db);
            color: white;
            border: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: background-color 0.3s ease;
            flex-shrink: 0;
        }
        
        .dawadost-send-button:hover {
            background-color: var(--hover-color, #0099b3);
        }
        
        .dawadost-typing-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            background-color: var(--card-bg, #ffffff);
            border-radius: 18px;
            width: fit-content;
            margin-bottom: 15px;
        }
        
        .dawadost-typing-dot {
            width: 6px;
            height: 6px;
            background-color: var(--text-color, #333333);
            border-radius: 50%;
            opacity: 0.6;
            animation: dawadost-typing 1.4s infinite ease-in-out;
        }
        
        .dawadost-typing-dot:nth-child(1) {
            animation-delay: 0s;
        }
        
        .dawadost-typing-dot:nth-child(2) {
            animation-delay: 0.2s;
        }
        
        .dawadost-typing-dot:nth-child(3) {
            animation-delay: 0.4s;
        }
        
        @keyframes dawadost-typing {
            0%, 60%, 100% {
                transform: translateY(0);
            }
            30% {
                transform: translateY(-4px);
            }
        }
        
        /* Mobile Responsive Styles */
        @media (max-width: 480px) {
            .dawadost-chat-modal {
                width: 100%;
                height: 100%;
                bottom: 0;
                right: 0;
                border-radius: 0;
                position: fixed;
                top: 0;
                left: 0;
            }
            
            .dawadost-chat-modal.active {
                display: flex;
                z-index: 9999;
            }
            
            /* Prevent background scrolling when chat is open */
            body.dawadost-chat-open {
                overflow: hidden;
                position: fixed;
                width: 100%;
                height: 100%;
                touch-action: none;
            }
            
            .dawadost-chat-messages {
                flex: 1;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                padding: 10px;
                min-height: 0; /* Prevents flex item from growing beyond its content */
            }
            
            .dawadost-chat-button {
                bottom: 10px;
                right: 10px;
                width: 45px;
                height: 45px;
            }
            
            .dawadost-chat-header {
                padding: 10px 15px;
                flex-shrink: 0; /* Prevents header from shrinking */
            }
            
            .dawadost-message-content {
                max-width: 85%;
                font-size: 13px;
            }
            
            .dawadost-chat-input-container {
                padding: 8px 10px;
                flex-shrink: 0; /* Prevents input container from shrinking */
            }
            
            .dawadost-chat-input {
                padding: 6px 10px;
                font-size: 13px;
            }
            
            .dawadost-send-button {
                width: 32px;
                height: 32px;
            }
            
            .dawadost-mode-selector {
                padding: 8px 10px;
                flex-shrink: 0; /* Prevents mode selector from shrinking */
            }
            
            .dawadost-mode-button {
                padding: 6px 12px;
                font-size: 13px;
            }
        }
    `;
    document.head.appendChild(styles);

    // Add styles for the mode selector
    const modeStyles = document.createElement('style');
    modeStyles.textContent = `
        .dawadost-mode-selector {
            padding: 10px 15px;
            background-color: var(--card-bg, #ffffff);
            border-top: 1px solid var(--border-color, #e0e0e0);
            display: flex;
            justify-content: center;
        }

        .dawadost-mode-button {
            background-color: var(--input-bg, #f5f5f5);
            color: var(--text-color, #333333);
            border: 1px solid var(--border-color, #e0e0e0);
            border-radius: 20px;
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }

        .dawadost-mode-button.active {
            background-color: var(--primary-color, #00b6db);
            color: white;
            border-color: var(--primary-color, #00b6db);
        }

        .dawadost-mode-button:hover {
            background-color: var(--hover-color, #0099b3);
            color: white;
        }
    `;
    document.head.appendChild(modeStyles);

    // Add styles for the date display
    const dateStyles = document.createElement('style');
    dateStyles.textContent = `
        .dawadost-date-display {
            display: flex;
            justify-content: center;
            margin: 10px 0;
            padding: 0 15px;
        }

        .dawadost-date-text {
            background-color: rgba(0, 0, 0, 0.1);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            color: var(--text-color, #666666);
            text-align: center;
        }

        .dawadost-chat-header {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background-color: var(--primary-color, #00b6db);
            color: white;
        }

        .dawadost-history-button {
            position: absolute;
            right: 40px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
        }

        .dawadost-close-button {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
        }
    `;
    document.head.appendChild(dateStyles);

    // Initialize the chatbot
    const chatbot = new DawaDost();
    const chatMessages = document.getElementById('dawadostChatMessages');
    const chatInput = document.getElementById('dawadostChatInput');
    const sendButton = chatModal.querySelector('.dawadost-send-button');
    const closeButton = chatModal.querySelector('.dawadost-close-button');

    // Toggle chat modal
    chatButton.addEventListener('click', async function() {
        chatModal.classList.toggle('active');
        if (chatModal.classList.contains('active')) {
            // Add class to body to prevent scrolling
            document.body.classList.add('dawadost-chat-open');
            
            // Clear any existing messages
            chatMessages.innerHTML = '';
            
            // Add the date display
            const dateDisplayDiv = document.createElement('div');
            dateDisplayDiv.className = 'dawadost-date-display';
            const dateTextSpan = document.createElement('span');
            dateTextSpan.className = 'dawadost-date-text';
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateTextSpan.textContent = now.toLocaleDateString('en-US', options);
            dateDisplayDiv.appendChild(dateTextSpan);
            chatMessages.appendChild(dateDisplayDiv);
            
            // Show loading indicator
            showTypingIndicator();
            
            // Load user data and generate greeting
            await chatbot.loadUserData();
            const greeting = chatbot.generateGreetingResponse();
            
            // Remove loading indicator
            removeTypingIndicator();
            
            // Add greeting message
            addMessage(greeting, 'bot');
        } else {
            // Remove class from body to allow scrolling
            document.body.classList.remove('dawadost-chat-open');
        }
    });

    // Close chat modal
    closeButton.addEventListener('click', function() {
        chatModal.classList.remove('active');
        // Remove class from body to allow scrolling
        document.body.classList.remove('dawadost-chat-open');
    });

    // Send message on button click
    sendButton.addEventListener('click', function() {
        sendMessage();
    });

    // Send message on Enter key
    chatInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Send message function
    async function sendMessage() {
        const message = chatInput.value.trim();
        
        if (message === '') return;
        
        // Add user message to chat
        addMessage(message, 'user');
        
        // Clear input
        chatInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Get bot response
        const response = await chatbot.processInput(message);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add bot response to chat
        addMessage(response, 'bot');
        
        // Scroll to bottom
        scrollToBottom();
    }

    // Add a message to the chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `dawadost-message dawadost-${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'dawadost-message-content';
        
        // Format the text with line breaks
        const formattedText = text.replace(/\n/g, '<br>');
        contentDiv.innerHTML = formattedText;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'dawadost-message-time';
        
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        timeDiv.textContent = `${hours}:${minutes} ${ampm}`;
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        
        chatMessages.appendChild(messageDiv);
        
        // Add to chat history
        chatbot.addToHistory(text, sender === 'user');
        
        // Scroll to bottom
        scrollToBottom();
    }

    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'dawadost-typing-indicator';
        typingDiv.id = 'dawadostTypingIndicator';
        
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('div');
            dot.className = 'dawadost-typing-dot';
            typingDiv.appendChild(dot);
        }
        
        chatMessages.appendChild(typingDiv);
        scrollToBottom();
    }

    // Remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('dawadostTypingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Scroll chat to bottom
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Add chat history button to header
    const chatHistoryButton = document.createElement('button');
    chatHistoryButton.className = 'dawadost-history-button';
    chatHistoryButton.innerHTML = '<i class="fas fa-history"></i>';
    chatHistoryButton.title = 'View Chat History';
    
    // Insert the history button before the close button
    const headerCloseButton = chatModal.querySelector('.dawadost-close-button');
    headerCloseButton.parentNode.insertBefore(chatHistoryButton, headerCloseButton);

    // Update the styles for the history button
    const historyStyles = document.createElement('style');
    historyStyles.textContent = `
        .dawadost-history-button {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            margin-right: 10px;
            position: absolute;
            right: 40px;
            top: 50%;
            transform: translateY(-50%);
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
        }

        .dawadost-history-button.active {
            color: var(--hover-color, #0099b3);
        }

        .dawadost-chat-header {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px;
            background-color: var(--primary-color, #00b6db);
            color: white;
        }

        .dawadost-close-button {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
        }
    `;
    document.head.appendChild(historyStyles);

    // Add event listeners for chat history
    chatHistoryButton.addEventListener('click', function() {
        chatHistoryButton.classList.toggle('active');
        const chatSubtitle = chatModal.querySelector('.dawadost-chat-title p');
        const chatInputContainer = chatModal.querySelector('.dawadost-chat-input-container');
        
        if (chatHistoryButton.classList.contains('active')) {
            // Store current chat state
            const currentMessages = Array.from(chatMessages.children)
                .filter(message => message.classList.contains('dawadost-message') || message.classList.contains('dawadost-date-display'))
                .map(message => {
                    if (message.classList.contains('dawadost-date-display')) {
                        return {
                            isDate: true,
                            text: message.querySelector('.dawadost-date-text').textContent
                        };
                    }
                    const content = message.querySelector('.dawadost-message-content');
                    const time = message.querySelector('.dawadost-message-time');
                    return {
                        isDate: false,
                        text: content ? content.innerHTML : '',
                        isUser: message.classList.contains('dawadost-user-message'),
                        time: time ? time.textContent : ''
                    };
                });
            
            // Clear current messages
            chatMessages.innerHTML = '';
            
            // Update subtitle
            chatSubtitle.textContent = 'Chat History';
            
            // Hide input container
            chatInputContainer.style.display = 'none';
            
            // Display chat history
            const history = chatbot.getChatHistory();
            if (history.length === 0) {
                // Add date display
                const dateDisplayDiv = document.createElement('div');
                dateDisplayDiv.className = 'dawadost-date-display';
                const dateTextSpan = document.createElement('span');
                dateTextSpan.className = 'dawadost-date-text';
                const now = new Date();
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                dateTextSpan.textContent = now.toLocaleDateString('en-US', options);
                dateDisplayDiv.appendChild(dateTextSpan);
                chatMessages.appendChild(dateDisplayDiv);

                // Add no history message
                const messageDiv = document.createElement('div');
                messageDiv.className = 'dawadost-message dawadost-bot-message';
                
                const contentDiv = document.createElement('div');
                contentDiv.className = 'dawadost-message-content';
                contentDiv.textContent = "No chat history available";
                
                const timeDiv = document.createElement('div');
                timeDiv.className = 'dawadost-message-time';
                const hours = now.getHours() % 12 || 12;
                const minutes = now.getMinutes().toString().padStart(2, '0');
                const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
                timeDiv.textContent = `${hours}:${minutes} ${ampm}`;
                
                messageDiv.appendChild(contentDiv);
                messageDiv.appendChild(timeDiv);
                chatMessages.appendChild(messageDiv);
            } else {
                // Group messages by date
                const messagesByDate = {};
                history.forEach(entry => {
                    const date = new Date(entry.timestamp);
                    const dateStr = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    
                    if (!messagesByDate[dateStr]) {
                        messagesByDate[dateStr] = [];
                    }
                    messagesByDate[dateStr].push(entry);
                });

                // Display messages grouped by date
                Object.keys(messagesByDate).forEach(dateStr => {
                    // Add date display
                    const dateDisplayDiv = document.createElement('div');
                    dateDisplayDiv.className = 'dawadost-date-display';
                    const dateTextSpan = document.createElement('span');
                    dateTextSpan.className = 'dawadost-date-text';
                    dateTextSpan.textContent = dateStr;
                    dateDisplayDiv.appendChild(dateTextSpan);
                    chatMessages.appendChild(dateDisplayDiv);

                    // Add messages for this date
                    messagesByDate[dateStr].forEach(entry => {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = `dawadost-message dawadost-${entry.isUser ? 'user' : 'bot'}-message`;
                        
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'dawadost-message-content';
                        contentDiv.innerHTML = entry.message || '';
                        
                        const timeDiv = document.createElement('div');
                        timeDiv.className = 'dawadost-message-time';
                        timeDiv.textContent = entry.formattedTime || '';
                        
                        messageDiv.appendChild(contentDiv);
                        messageDiv.appendChild(timeDiv);
                        chatMessages.appendChild(messageDiv);
                    });
                });
                
                // Add clear history button
                const clearHistoryButton = document.createElement('button');
                clearHistoryButton.className = 'dawadost-clear-history-button';
                clearHistoryButton.innerHTML = '<i class="fas fa-trash"></i> Clear History';
                clearHistoryButton.onclick = function() {
                    if (confirm('Are you sure you want to clear all chat history?')) {
                        chatbot.clearChatHistory();
                        chatMessages.innerHTML = '';
                        
                        // Add date display
                        const dateDisplayDiv = document.createElement('div');
                        dateDisplayDiv.className = 'dawadost-date-display';
                        const dateTextSpan = document.createElement('span');
                        dateTextSpan.className = 'dawadost-date-text';
                        const now = new Date();
                        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                        dateTextSpan.textContent = now.toLocaleDateString('en-US', options);
                        dateDisplayDiv.appendChild(dateTextSpan);
                        chatMessages.appendChild(dateDisplayDiv);
                        
                        // Show "No chat history" message
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'dawadost-message dawadost-bot-message';
                        
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'dawadost-message-content';
                        contentDiv.textContent = "No chat history available";
                        
                        const timeDiv = document.createElement('div');
                        timeDiv.className = 'dawadost-message-time';
                        const hours = now.getHours() % 12 || 12;
                        const minutes = now.getMinutes().toString().padStart(2, '0');
                        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
                        timeDiv.textContent = `${hours}:${minutes} ${ampm}`;
                        
                        messageDiv.appendChild(contentDiv);
                        messageDiv.appendChild(timeDiv);
                        chatMessages.appendChild(messageDiv);
                    }
                };
                chatMessages.appendChild(clearHistoryButton);
            }
            
            // Store current chat state in the button's dataset
            chatHistoryButton.dataset.currentChat = JSON.stringify(currentMessages);
            
            // Update button title
            chatHistoryButton.title = 'Return to Current Chat';
        } else {
            // Clear messages
            chatMessages.innerHTML = '';
            
            // Update subtitle
            chatSubtitle.textContent = 'Your Health Assistant';
            
            // Show input container
            chatInputContainer.style.display = 'flex';
            
            // Restore current chat state
            const currentChat = JSON.parse(chatHistoryButton.dataset.currentChat || '[]');
            if (currentChat.length > 0) {
                currentChat.forEach(message => {
                    if (message.isDate) {
                        const dateDisplayDiv = document.createElement('div');
                        dateDisplayDiv.className = 'dawadost-date-display';
                        const dateTextSpan = document.createElement('span');
                        dateTextSpan.className = 'dawadost-date-text';
                        dateTextSpan.textContent = message.text;
                        dateDisplayDiv.appendChild(dateTextSpan);
                        chatMessages.appendChild(dateDisplayDiv);
                    } else {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = `dawadost-message dawadost-${message.isUser ? 'user' : 'bot'}-message`;
                        
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'dawadost-message-content';
                        contentDiv.innerHTML = message.text || '';
                        
                        const timeDiv = document.createElement('div');
                        timeDiv.className = 'dawadost-message-time';
                        timeDiv.textContent = message.time || '';
                        
                        messageDiv.appendChild(contentDiv);
                        messageDiv.appendChild(timeDiv);
                        chatMessages.appendChild(messageDiv);
                    }
                });
            } else {
                // Add date display
                const dateDisplayDiv = document.createElement('div');
                dateDisplayDiv.className = 'dawadost-date-display';
                const dateTextSpan = document.createElement('span');
                dateTextSpan.className = 'dawadost-date-text';
                const now = new Date();
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                dateTextSpan.textContent = now.toLocaleDateString('en-US', options);
                dateDisplayDiv.appendChild(dateTextSpan);
                chatMessages.appendChild(dateDisplayDiv);

                // If no current chat state, show initial greeting
                const greeting = chatbot.generateGreetingResponse();
                addMessage(greeting, 'bot');
            }
            
            // Update button title
            chatHistoryButton.title = 'View Chat History';
        }
        
        // Scroll to bottom
        scrollToBottom();
    });

    // Add styles for the clear history button
    const clearHistoryStyles = document.createElement('style');
    clearHistoryStyles.textContent = `
        .dawadost-clear-history-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin: 15px auto;
            padding: 8px 16px;
            background-color: #ff4444;
            color: white;
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s ease;
        }

        .dawadost-clear-history-button:hover {
            background-color: #cc0000;
        }

        .dawadost-clear-history-button i {
            font-size: 14px;
        }
    `;
    document.head.appendChild(clearHistoryStyles);

    // Function to update the date display
    function updateDateDisplay() {
        const dateDisplay = chatModal.querySelector('.dawadost-date-text');
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        dateDisplay.textContent = now.toLocaleDateString('en-US', options);
    }

    // Update date display initially and set up interval to check for day changes
    updateDateDisplay();
    let lastCheckedDate = new Date().getDate();
    setInterval(() => {
        const currentDate = new Date().getDate();
        if (currentDate !== lastCheckedDate) {
            updateDateDisplay();
            lastCheckedDate = currentDate;
        }
    }, 60000); // Check every minute
}); // End of DOMContentLoaded event listener
