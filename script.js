// Initialize Supabase client
// Use an application-specific name: the CDN also exposes a global named
// `supabase`, so a top-level `const supabase` can make this entire file fail
// to parse in production.
const dawaSupabase = window.supabase.createClient(
    window.SUPABASE_CONFIG.url,
    window.SUPABASE_CONFIG.anonKey
);

// Move previewImage function outside DOMContentLoaded
function previewImage() {
    const fileInput = document.getElementById('prescriptionImage');
    const file = fileInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Get the modal
            const modal = document.querySelector('.image-modal');
            const modalImage = document.getElementById('modalImage');
            
            // Set image source and show modal
            modalImage.src = e.target.result;
            modal.style.display = 'flex';
            
            // Add close functionality
            const closeBtn = modal.querySelector('.close-image-modal');
            closeBtn.onclick = () => {
                modal.style.display = 'none';
            };
            
            // Close on clicking outside
            modal.onclick = (event) => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            };
        }
        reader.readAsDataURL(file);
    } else {
        showNotification('Please choose a file first', 'error', true);
    }
}

// Also move sendEmailReminder function outside DOMContentLoaded
async function sendEmailReminder(userId, reminderType, details) {
    try {
        console.log('Starting email reminder process:', { userId, reminderType, details });

        // Get user's email from profile
        const { data: profile, error: profileError } = await dawaSupabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();
        
        if (profileError) {
            console.error('Profile error:', profileError);
            throw profileError;
        }
        if (!profile?.email) {
            console.error('No email found for user:', userId);
            throw new Error('User email not found');
        }

        console.log('Found user email:', profile.email);

        // Get current session
        const { data: { session }, error: sessionError } = await dawaSupabase.auth.getSession();
        if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
        }
        if (!session) {
            console.error('No active session found');
            throw new Error('No active session');
        }

        // Update email content templates
        const emailContent = {
            expiry: {
                subject: 'Medicine Expiry Reminder',
                message: `Your medicine ${details.medicine_name} will expire on ${formatDateTime(details.expiry_date).split(',')[0]}`
            },
            prescription: {
                subject: 'Medicine Prescription Reminder',
                message: `Time to take ${details.medicine_name} - ${details.dosage} ${details.frequency} at ${formatDateTime(details.reminder_preference)}`
            },
            checkup: {
                subject: 'Medical Checkup Reminder',
                message: `You have an appointment with Dr. ${details.doctor_name} at ${details.clinic_location} on ${formatDateTime(details.appointment_datetime)}`
            }
        }[reminderType];

        if (!emailContent) {
            console.error('Invalid reminder type:', reminderType);
            throw new Error(`Invalid reminder type: ${reminderType}`);
        }

        // Prepare request body
        const requestBody = {
            to: profile.email,
            subject: emailContent.subject,
            message: emailContent.message
        };

        console.log('Sending email request:', requestBody);

        // Send email using Edge Function
        const response = await fetch(`${window.SUPABASE_CONFIG.url}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        console.log('Email API response status:', response.status);
        const responseData = await response.json();
        console.log('Email API response:', responseData);

        if (!response.ok) {
            throw new Error(responseData.error || 'Failed to send email');
        }

        return responseData;
    } catch (error) {
        console.error('Error sending email reminder:', error);
        throw error;
    }
}

// Move formatDateForDisplay function outside if it's not already
function formatDateForDisplay(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Update showNotification function
function showNotification(message, type = 'info', autoHide = true) {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.classList.add('fade-out');
        setTimeout(() => existingNotification.remove(), 300);
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    const icon = {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    }[type];

    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
        <i class="fas fa-xmark" style="margin-left: auto; cursor: pointer; font-size: 1.1em; opacity: 0.7;"></i>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Force a reflow to enable the transition
    notification.offsetHeight;

    // Add click handler for close button
    const closeButton = notification.querySelector('.fa-xmark');
    closeButton.addEventListener('click', () => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    });

    // Auto hide after 2.5 seconds
        setTimeout(() => {
            if (document.body.contains(notification)) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    notification.remove();
                }
            }, 300);
        }
    }, 2500);
}

// Add this helper function at the top level, with other helper functions
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

// Update Google Calendar constants and initialization
const GOOGLE_CLIENT_ID = '887243220092-3vj3tklll6meojqrcdcgdrc48568fnh5.apps.googleusercontent.com';
const GOOGLE_API_KEY = 'AIzaSyBVlhaLcj5AkSnx9k3b6PUsAtPyOK1Gds0';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gapiInited = false;
let gisInited = false;

// Update the initialization function
function initializeGoogleAPI() {
    return new Promise((resolve, reject) => {
    gapi.load('client', async () => {
        try {
            await gapi.client.init({
                apiKey: GOOGLE_API_KEY,
                discoveryDocs: [DISCOVERY_DOC]
            });

                // Initialize the token client after gapi is loaded
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    scope: SCOPES,
                    callback: '', // Will be set later
                    prompt: 'consent' // Force consent prompt
                });
                
                gapiInited = true;
                gisInited = true;
                console.log('Google APIs initialized successfully');
                resolve();
            } catch (error) {
                console.error('Error initializing Google API:', error);
                reject(error);
            }
        });
    });
}

// Update the authentication function
async function authenticateGoogleCalendar() {
    if (!gapiInited || !gisInited) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for initialization
        if (!gapiInited || !gisInited) {
            throw new Error('Google APIs not initialized');
        }
    }

    if (!gapi.client.getToken()) {
        return new Promise((resolve, reject) => {
            try {
                tokenClient.callback = async (resp) => {
                    if (resp.error) {
                        reject(new Error('Access denied'));
                        return;
                    }
                    resolve(resp);
                };
                tokenClient.requestAccessToken({
                    prompt: 'consent'
                });
        } catch (error) {
                reject(new Error('Failed to request access token'));
        }
    });
    }
}

// Update addToCalendar function with better permission handling
async function addToCalendar(type, details) {
    try {
        // Check if Google API is loaded
        if (!gapi || !gapi.client) {
            throw new Error('Google API not loaded');
        }

        // Check if user is authenticated with Google
        if (!gapi.client.getToken()) {
            // Request calendar permission explicitly
            await new Promise((resolve, reject) => {
                tokenClient.callback = async (resp) => {
                    if (resp.error) {
                        reject(new Error('Google Calendar permission denied'));
                        return;
                    }
                    resolve(resp);
                };
                tokenClient.requestAccessToken({ 
                    scope: 'https://www.googleapis.com/auth/calendar.events',
                    prompt: 'consent'
                });
            });
        }

        // Create event based on reminder type
        const event = createCalendarEvent(type, details);

        // Insert the event
        const response = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event
        });

        console.log('Calendar event created:', response);
        return response;

    } catch (error) {
        console.error('Calendar error:', error);
        if (error.message.includes('permission') || error.status === 403) {
            throw new Error('Please grant calendar access to add reminders');
        }
        throw error;
    }
}

// Update handleReminderCreation function with proper notification order
async function handleReminderCreation(type, details) {
    try {
        console.log('Starting reminder creation:', { type, details });
        let emailSent = false;
        let calendarAdded = false;

        // Check if user_id exists
        if (!details.user_id) {
            const { data: { user }, error: userError } = await dawaSupabase.auth.getUser();
            if (userError) throw userError;
            details.user_id = user.id;
        }

        // First try to send confirmation email
        try {
            await sendConfirmationEmail(details.user_id, type, details);
            console.log('Confirmation email sent successfully');
            emailSent = true;
            showNotification(`${type} reminder saved and confirmation email sent!`, 'success', true);
        } catch (emailError) {
            console.error('Email error:', emailError);
            showNotification(`${type} reminder saved but failed to send confirmation email`, 'warning', true);
        }
        
        // Then try to create calendar event
        try {
            await addToCalendar(type, details);
            console.log('Calendar event created successfully');
            calendarAdded = true;
            showNotification('Reminder added to Google Calendar!', 'success', true);
        } catch (calendarError) {
            console.error('Calendar error:', calendarError);
            showNotification('Failed to add reminder to Google Calendar', 'warning', true);
        }

    } catch (error) {
        console.error('Reminder creation error:', error);
        throw new Error(`Failed to create ${type} reminder: ${error.message}`);
    }
}

// Update maybeEnableButtons function
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        console.log('Google APIs initialized successfully');
    }
}

// Update sendConfirmationEmail function with better error handling
async function sendConfirmationEmail(userId, type, details) {
    try {
        console.log('Starting confirmation email process:', { userId, type, details });

        // Get user's email
        const { data: profile, error: profileError } = await dawaSupabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            throw new Error(`Failed to fetch profile: ${profileError.message}`);
        }
        
        if (!profile?.email) {
            throw new Error('User email not found');
        }

        // Get current session
        const { data: { session }, error: sessionError } = await dawaSupabase.auth.getSession();
        if (sessionError) {
            console.error('Session error:', sessionError);
            throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (!session) {
            throw new Error('No active session found');
        }

        // Prepare email content based on type
        const emailContent = {
            expiry: {
                subject: 'Medicine Expiry Reminder Set',
                message: `
                    <h2>Medicine Expiry Reminder Confirmation</h2>
                    <p>You have set a reminder for the following medicine:</p>
                    <ul>
                        <li>Medicine Name: ${details.medicine_name}</li>
                        <li>Expiry Date: ${formatDateTime(details.expiry_date).split(',')[0]}</li>
                        <li>Medicine Type: ${details.medicine_type}</li>
                        <li>Reminder Set For: ${formatDateTime(details.reminder_preference)}</li>
                    </ul>
                `
            },
            prescription: {
                subject: 'Medicine Prescription Reminder Set',
                message: `
                    <h2>Prescription Reminder Confirmation</h2>
                    <p>You have set a reminder for the following prescription:</p>
                    <ul>
                        <li>Prescription Name: ${details.prescription_name || 'Not specified'}</li>
                        <li>Medicine Name: ${details.medicine_name}</li>
                        <li>Dosage: ${details.dosage}</li>
                        <li>Frequency: ${details.frequency}</li>
                        <li>Time to Take: ${details.time_to_take ? new Date(`2000-01-01T${details.time_to_take}`).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'Not specified'}</li>
                        <li>Reminder Set For: ${formatDateTime(details.reminder_preference)}</li>
                    </ul>
                `
            },
            checkup: {
                subject: 'Medical Checkup Reminder Set',
                message: `
                    <h2>Checkup Appointment Reminder Confirmation</h2>
                    <p>You have set a reminder for the following appointment:</p>
                    <ul>
                        <li>Doctor: ${details.doctor_name}</li>
                        <li>Clinic: ${details.clinic_location}</li>
                        <li>Appointment: ${formatDateTime(details.appointment_datetime)}</li>
                        <li>Reminder Set For: ${formatDateTime(details.reminder_preference)}</li>
                    </ul>
                `
            }
        }[type];

        if (!emailContent) {
            throw new Error(`Invalid reminder type: ${type}`);
        }

        console.log('Sending confirmation email:', {
            to: profile.email,
            subject: emailContent.subject
        });

        // Send email using Edge Function
        const response = await fetch(`${window.SUPABASE_CONFIG.url}/functions/v1/send-email`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: profile.email,
                subject: emailContent.subject,
                message: emailContent.message
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Email API error: ${errorData.error || response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Email sent successfully:', responseData);
        return responseData;

    } catch (error) {
        console.error('Confirmation email error:', error);
        throw new Error(`Failed to send confirmation email: ${error.message}`);
    }
}

// Add this function near the other helper functions
function calculateDaysRemaining(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate day calculation
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Define the ranges
    const oneMonth = 30;
    const fourMonths = 120;
    
    // Return object with message and color
    if (diffDays < 0) {
        return {
            message: 'Expired',
            color: '#ff4d4d'  // Red
        };
    } else if (diffDays === 0) {
        return {
            message: 'Expires today',
            color: '#ff4d4d'  // Red
        };
    } else if (diffDays <= oneMonth) {
        return {
            message: diffDays === 1 ? '1 day to expire' : `${diffDays} days to expire`,
            color: '#ff4d4d'  // Red
        };
    } else if (diffDays <= fourMonths) {
        return {
            message: `${diffDays} days to expire`,
            color: '#ffa500'  // Yellow-orange
        };
    } else {
        return {
            message: `${diffDays} days to expire`,
            color: '#00e676'  // Green
        };
    }
}

// Add createCalendarEvent function back
function createCalendarEvent(type, details) {
    // Format date for Google Calendar
    const startTime = new Date(details.reminder_preference);
    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes later

    // Create event details based on type
    const eventDetails = {
        expiry: {
            summary: `Medicine Expiry: ${details.medicine_name}`,
            description: `Medicine Type: ${details.medicine_type}\nExpiry Date: ${formatDateTime(details.expiry_date)}`,
        },
        prescription: {
            summary: `Take Medicine: ${details.medicine_name}`,
            description: `Prescription: ${details.prescription_name}\nDosage: ${details.dosage}\nFrequency: ${details.frequency}`,
        },
        checkup: {
            summary: `Medical Checkup with Dr. ${details.doctor_name}`,
            description: `Location: ${details.clinic_location}\nAppointment: ${formatDateTime(details.appointment_datetime)}`,
        }
    }[type];

    if (!eventDetails) {
        throw new Error(`Invalid reminder type: ${type}`);
    }

    // Create the event object
    return {
        summary: eventDetails.summary,
        description: eventDetails.description,
        start: {
            dateTime: startTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: endTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 10 }
            ]
        }
    };
}

// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Calendar is optional. Do not block the dashboard while third-party
        // Google scripts load (or when an extension/network blocks them).
        if (window.gapi && window.google) {
            initializeGoogleAPI().catch((calendarError) => {
                console.warn('Google Calendar is unavailable:', calendarError);
            });
        }
    
    // Check if user is authenticated
    const { data: { user }, error } = await dawaSupabase.auth.getUser();
    if (error || !user) {
        window.location.href = 'login.html';
        return;
    }

        // Calendar authentication is only needed when the user saves a reminder.
        window.authenticateGoogleCalendar = async function() {
            if (!window.gapi || !window.google) {
                throw new Error('Google Calendar is unavailable. Please try again later.');
            }
            if (!gapiInited || !gisInited) {
                await initializeGoogleAPI();
            }
            if (!gapi.client.getToken()) {
                return new Promise((resolve, reject) => {
                    try {
                        tokenClient.callback = async (resp) => {
                            if (resp.error) {
                                reject(new Error('Access denied'));
                                return;
                            }
                            resolve(resp);
                        };
                        tokenClient.requestAccessToken({
                            prompt: 'consent'
                        });
                    } catch (error) {
                        reject(new Error('Failed to request access token'));
                    }
                });
            }
        };

    // User Profile Handling
    const userProfileIcon = document.getElementById('userProfileIcon');
    const userProfileModal = document.getElementById('userProfileModal');
    const saveProfileBtn = document.querySelector('.save-profile-btn');
    
    // Profile form fields
    const profileFields = {
        name: document.getElementById('userName'),
        age: document.getElementById('userAge'),
        gender: document.getElementById('userGender'),
        email: document.getElementById('userEmail'),
        mobile: document.getElementById('userMobile'),
        emergencyMobile: document.getElementById('userEmergencyMobile')
    };

    let currentUserId = null;

    // Load saved profile data
    const loadProfileData = async () => {
        try {
            // Get the current user's ID and metadata from Supabase
            const { data: { user }, error: userError } = await dawaSupabase.auth.getUser();
            if (userError) throw userError;

            if (user) {
                // Set the email and full name from auth data
                profileFields.email.value = user.email;
                profileFields.name.value = user.user_metadata.full_name;
                
                // Make email field readonly since it's from auth
                profileFields.email.readOnly = true;
                
                // Fetch additional profile data from profiles table
                const { data, error } = await dawaSupabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') { // Ignore "not found" error
                    throw error;
                }

                if (data) {
                    // Update remaining form fields with profile data
                    Object.entries(profileFields).forEach(([key, field]) => {
                        // Skip email and name as they're already set from auth data
                        if (key !== 'email' && key !== 'name') {
                            // Handle emergency mobile field differently
                            if (key === 'emergencyMobile') {
                                field.value = data.emergency_mobile;
                            } else if (data[key]) {
                                field.value = data[key];
                            }
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            showNotification('Failed to load profile data', 'error', true);
        }
    };

    // Save profile data
    const saveProfileData = async () => {
        try {
            // Validate all required fields except email and name
            const requiredFields = ['age', 'gender', 'mobile', 'emergencyMobile'];
            const missingFields = [];
            
            requiredFields.forEach(key => {
                if (!profileFields[key].value.trim()) {
                    missingFields.push(key);
                    profileFields[key].classList.add('error');
                } else {
                    profileFields[key].classList.remove('error');
                }
            });

            if (missingFields.length > 0) {
                showNotification('Please fill in all required fields', 'error', true);
                return;
            }

            // Validate age
            const age = parseInt(profileFields.age.value);
            if (isNaN(age) || age <= 0 || age > 150) {
                profileFields.age.classList.add('error');
                showNotification('Please enter a valid age (1-150)', 'error', true);
                return;
            }

            // Validate mobile numbers
            const mobileRegex = /^\d{10}$/;
            if (!mobileRegex.test(profileFields.mobile.value)) {
                profileFields.mobile.classList.add('error');
                showNotification('Mobile number must be 10 digits', 'error', true);
                return;
            }

            if (!mobileRegex.test(profileFields.emergencyMobile.value)) {
                profileFields.emergencyMobile.classList.add('error');
                showNotification('Emergency mobile number must be 10 digits', 'error', true);
                return;
            }

            const { data: { user }, error: userError } = await dawaSupabase.auth.getUser();
            if (userError) throw userError;

            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'delete-overlay';
            
            // Create confirmation popup
            const confirmation = document.createElement('div');
            confirmation.className = 'delete-confirmation';
            confirmation.innerHTML = `
                <h3 style="color: var(--success-color)"><i class="fas fa-save"></i> Save Profile</h3>
                <p>Are you sure you want to save these changes to your profile?</p>
                <div class="delete-confirmation-buttons">
                    <button class="cancel-delete">Cancel</button>
                    <button class="confirm-delete" style="background-color: var(--primary-color)">Save Changes</button>
                </div>
            `;

            // Add to DOM
            document.body.appendChild(overlay);
            document.body.appendChild(confirmation);

            // Show with animation
            overlay.style.display = 'block';
            confirmation.style.display = 'block';
            requestAnimationFrame(() => {
                overlay.classList.add('show');
                confirmation.classList.add('show');
            });

            // Handle button clicks
            const handleSave = async () => {
                try {
                    // Prepare profile data
                    const profileData = {
                        id: user.id,
                        full_name: profileFields.name.value.trim(),
                        email: profileFields.email.value.trim(),
                        age: parseInt(profileFields.age.value),
                        gender: profileFields.gender.value,
                        mobile: profileFields.mobile.value,
                        emergency_mobile: profileFields.emergencyMobile.value,
                        updated_at: new Date().toISOString()
                    };

                    // Upsert the profile data
                    const { error } = await dawaSupabase
                        .from('profiles')
                        .upsert(profileData, {
                            onConflict: 'id',
                            returning: 'minimal'
                        });

                    if (error) throw error;

                    // Close confirmation and modal
                    overlay.classList.remove('show');
                    confirmation.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                        document.body.removeChild(confirmation);
                    }, 300);
                    closeModal(userProfileModal);

                    // Show success notification
                    showNotification('Profile saved successfully!', 'success', true);

                } catch (error) {
                    console.error('Error saving profile:', error);
                    overlay.classList.remove('show');
                    confirmation.classList.remove('show');
                    setTimeout(() => {
                        document.body.removeChild(overlay);
                        document.body.removeChild(confirmation);
                    }, 300);
                    showNotification(error.message || 'Failed to save profile', 'error', true);
                }
            };

            const handleCancel = () => {
                overlay.classList.remove('show');
                confirmation.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    document.body.removeChild(confirmation);
                }, 300);
            };

            confirmation.querySelector('.confirm-delete').addEventListener('click', handleSave);
            confirmation.querySelector('.cancel-delete').addEventListener('click', handleCancel);

            // Close on overlay click
            overlay.addEventListener('click', handleCancel);

            // Close on Escape key
            document.addEventListener('keydown', function closeOnEscape(e) {
                if (e.key === 'Escape') {
                    handleCancel();
                    document.removeEventListener('keydown', closeOnEscape);
                }
            });

        } catch (error) {
            console.error('Error in save profile process:', error);
            showNotification(error.message || 'Failed to process save request', 'error', true);
        }
    };

    // Delete profile
    const deleteProfile = async () => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'delete-overlay';
        
        // Create confirmation popup
        const confirmation = document.createElement('div');
        confirmation.className = 'delete-confirmation';
        confirmation.innerHTML = `
            <h3><i class="fas fa-exclamation-triangle"></i> Delete Profile</h3>
            <p>Are you sure you want to delete your profile? This will permanently delete your account and all associated data. This action cannot be undone.</p>
            <div class="delete-confirmation-buttons">
                <button class="cancel-delete">Cancel</button>
                <button class="confirm-delete">Delete Profile</button>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(overlay);
        document.body.appendChild(confirmation);

        // Show with animation
        overlay.style.display = 'block';
        confirmation.style.display = 'block';
        requestAnimationFrame(() => {
            overlay.classList.add('show');
            confirmation.classList.add('show');
        });

        // Handle button clicks
        const handleDelete = async () => {
            try {
                const { data: { user }, error: userError } = await dawaSupabase.auth.getUser();
                if (userError) throw userError;

                // First delete profile data
                const { error: profileError } = await dawaSupabase
                    .from('profiles')
                    .delete()
                    .eq('id', user.id);

                if (profileError) throw profileError;

                // Delete the user account
                const { error: deleteError } = await dawaSupabase.rpc('delete_user');
                if (deleteError) throw deleteError;

                // Sign out after successful deletion
                await dawaSupabase.auth.signOut();
                
                // Clear local storage
                localStorage.removeItem('authToken');
                localStorage.removeItem('userId');

                // Close all modals and cleanup
                overlay.classList.remove('show');
                confirmation.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    document.body.removeChild(confirmation);
                }, 300);
                closeModal(userProfileModal);

                // Show success notification after a small delay
                setTimeout(() => {
                    showNotification('Profile deleted successfully', 'success', true);
                }, 100);

            } catch (error) {
                console.error('Error deleting account:', error);
                showNotification(error.message || 'Failed to delete account', 'error', true);
            }
        };

        const handleCancel = () => {
            overlay.classList.remove('show');
            confirmation.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(confirmation);
            }, 300);
        };

        confirmation.querySelector('.confirm-delete').addEventListener('click', handleDelete);
        confirmation.querySelector('.cancel-delete').addEventListener('click', handleCancel);

        // Close on overlay click
        overlay.addEventListener('click', handleCancel);

        // Close on Escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    };

    // Create a container for the buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'profile-buttons';

    // Update save profile button
    saveProfileBtn.className = 'save-profile-btn';

    // Update logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.textContent = 'Logout';
    logoutBtn.className = 'logout-btn';

    // Add buttons to container
    buttonContainer.appendChild(saveProfileBtn);
    buttonContainer.appendChild(logoutBtn);

    // Add container after the profile fields
    document.querySelector('.profile-details').appendChild(buttonContainer);

    // Add delete profile button after the button container
    const deleteProfileBtn = document.createElement('button');
    deleteProfileBtn.textContent = 'Delete Profile';
    deleteProfileBtn.className = 'delete-profile-btn';
    deleteProfileBtn.onclick = deleteProfile;
    buttonContainer.parentNode.insertBefore(deleteProfileBtn, buttonContainer.nextSibling);

    // Age input validation
    if (profileFields.age) {
        // Prevent manual input of invalid characters
        profileFields.age.addEventListener('keydown', (e) => {
            if (e.key === '-' || e.key === 'e' || e.key === '.') {
                e.preventDefault();
            }
        });

        // Ensure value stays within bounds
        profileFields.age.addEventListener('input', function() {
            let value = parseInt(this.value);
            if (value < 0) this.value = 0;
            if (value > 150) this.value = 150;
        });
    }

    // Event Listeners
    userProfileIcon.addEventListener('click', () => {
        userProfileModal.style.display = 'block';
        requestAnimationFrame(() => {
            userProfileModal.classList.add('show');
        });
        loadProfileData();
    });

    saveProfileBtn.addEventListener('click', saveProfileData);

    // Modal handling
    const modals = {
        expiry: document.getElementById('expiryModal'),
        prescription: document.getElementById('prescriptionModal'),
        checkup: document.getElementById('checkupModal')
    };

    // Set up modal triggers
    document.querySelectorAll('.set-reminder-btn').forEach(button => {
        button.addEventListener('click', () => {
            const modalType = button.getAttribute('data-type');
            const modal = modals[modalType];
            modal.style.display = 'block';
            // Add small delay to trigger animation
            requestAnimationFrame(() => {
                modal.classList.add('show');
            });
        });
    });

    // Close modal functionality
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            closeModal(modal);
        });
    });

    // Add close modal function
    function closeModal(modal) {
        modal.classList.remove('show');
        // Wait for animation to complete before hiding
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        Object.values(modals).forEach(modal => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });

        // Handle user profile modal
        const userProfileModal = document.getElementById('userProfileModal');
        if (event.target === userProfileModal) {
            closeModal(userProfileModal);
        }
    });

    // Handle custom time selections
    document.querySelectorAll('select').forEach(select => {
        select.addEventListener('change', (e) => {
            const customTimeInput = e.target.parentElement.querySelector('.custom-time');
            if (customTimeInput) {
                customTimeInput.style.display = e.target.value === 'custom' ? 'block' : 'none';
            }
        });
    });

    // Handle reminder preference changes
    const reminderSelect = document.querySelector('.reminder-preferences select');
    const customTimeInput = document.querySelector('.custom-time');
    
    if (reminderSelect && customTimeInput) {
        reminderSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customTimeInput.classList.add('show');
                customTimeInput.required = true;
                
                // Set min datetime to current date and time
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                
                customTimeInput.min = `${year}-${month}-${day}T${hours}:${minutes}`;
            } else {
                customTimeInput.classList.remove('show');
                customTimeInput.required = false;
            }
        });
    }

    // Prescription reminder time selection
    const prescriptionModal = document.getElementById('prescriptionModal');
    if (prescriptionModal) {
        const reminderSelect = prescriptionModal.querySelector('.reminder-time-select');
        const customDatetime = prescriptionModal.querySelector('.custom-datetime');
        const customDatetimeInput = prescriptionModal.querySelector('.custom-datetime-input');

        if (reminderSelect && customDatetimeInput) {
            // Set minimum datetime to now
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            customDatetimeInput.min = minDateTime;

            reminderSelect.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customDatetime.style.display = 'block';
                    customDatetimeInput.required = true;
                } else {
                    customDatetime.style.display = 'none';
                    customDatetimeInput.required = false;
                }
            });
        }
    }

    // Image Upload Handling
    const uploadBtn = document.querySelector('.upload-btn');
    const fileInput = document.getElementById('prescriptionImage');
    const fileInfo = document.querySelector('.file-info');
    const fileName = document.querySelector('.file-name');
    const removeImageBtn = document.querySelector('.remove-image');
    const viewImageBtn = document.querySelector('.view-image');
    let currentImageData = null;

    if (uploadBtn && fileInput) {
        // Get modal elements once
        const imageModal = document.querySelector('.image-modal');
        const closeImageModalBtn = document.querySelector('.close-image-modal');

        // Function to close modal
        function closeImageModal() {
            imageModal.classList.remove('show');
            setTimeout(() => {
                imageModal.style.display = 'none';
            }, 300); // Match transition duration
        }

        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileName.textContent = file.name;
                fileInfo.style.display = 'flex';
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    currentImageData = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        removeImageBtn.addEventListener('click', () => {
            fileInput.value = '';
            fileInfo.style.display = 'none';
            currentImageData = null;
        });

        viewImageBtn.addEventListener('click', () => {
            if (currentImageData) {
                const modalImage = document.getElementById('modalImage');
                modalImage.src = currentImageData;
                imageModal.style.display = 'flex';
                requestAnimationFrame(() => {
                    imageModal.classList.add('show');
                });
            }
        });

        // Add close modal event listeners
        closeImageModalBtn.addEventListener('click', closeImageModal);

        imageModal.addEventListener('click', (event) => {
            if (event.target === imageModal) {
                closeImageModal();
            }
        });

        // Global escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && imageModal.style.display === 'flex') {
                closeImageModal();
            }
        });
    }

    // Add medicine button functionality
    const addMedicineBtn = document.getElementById('addMedicine');
    const medicineList = document.getElementById('medicineList');

    if (addMedicineBtn && medicineList) {
        addMedicineBtn.addEventListener('click', () => {
            const newMedicineItem = document.createElement('div');
            newMedicineItem.className = 'medicine-item';
            newMedicineItem.innerHTML = `
                <div class="form-group">
                    <label>Medicine Name</label>
                    <input type="text" name="medicineName" required placeholder="Enter medicine name">
                </div>
                <div class="form-group">
                    <label>Dosage</label>
                    <input type="number" name="dosage" required placeholder="Enter dosage" step="0.5">
                </div>
                <div class="form-group">
                    <label>Frequency</label>
                <select name="frequency" required>
                        <option value="">Select frequency</option>
                    <option value="once">Once Daily</option>
                    <option value="twice">Twice Daily</option>
                    <option value="thrice">Thrice Daily</option>
                </select>
                </div>
                <div class="form-group">
                    <label>Time to Take</label>
                    <input type="time" name="timeToTake" required>
                </div>
                <div class="form-group">
                    <label>Reminder Preference</label>
                    <input type="datetime-local" name="reminderPreference" required>
                </div>
                <button type="button" class="remove-medicine-btn">
                    <i class="fas fa-minus"></i>
                </button>
            `;
            medicineList.appendChild(newMedicineItem);

            // Add remove button functionality
            const removeBtn = newMedicineItem.querySelector('.remove-medicine-btn');
            removeBtn.addEventListener('click', () => {
                newMedicineItem.remove();
            });
        });
    }

    // Initialize search functionality
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    // Get search button
    const searchButton = document.querySelector('.search-container button');

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', async (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (!searchTerm) {
                searchResults.innerHTML = '';
                return;
            }

            try {
                // Get all medicine records from all tables
                const [expiryMeds, prescriptionMeds, checkupMeds] = await Promise.all([
                    dawaSupabase
                        .from('medicine_expiry')
                        .select('*')
                        .eq('user_id', user.id)
                        .or(`medicine_name.ilike.%${searchTerm}%,medicine_type.ilike.%${searchTerm}%`),

                    dawaSupabase
                        .from('prescription_medicines')
                        .select(`
                            *,
                            prescriptions!inner(user_id)
                        `)
                        .eq('prescriptions.user_id', user.id)
                        .ilike('medicine_name', `%${searchTerm}%`),

                    dawaSupabase
                        .from('checkup')
                        .select('*')
                        .eq('user_id', user.id)
                        .or(`doctor_name.ilike.%${searchTerm}%,clinic_location.ilike.%${searchTerm}%`)
                ]);

                // Combine and format results
                const results = [
                    ...(expiryMeds.data || []).map(med => ({
                        name: med.medicine_name,
                        type: med.medicine_type,
                        expiry: med.expiry_date,
                        source: 'expiry'
                    })),
                    ...(prescriptionMeds.data || []).map(med => ({
                        name: med.medicine_name,
                        dosage: med.dosage,
                        frequency: med.frequency,
                        source: 'prescription'
                    })),
                    ...(checkupMeds.data || []).map(checkup => ({
                        name: checkup.doctor_name,
                        location: checkup.clinic_location,
                        appointment: checkup.appointment_datetime,
                        source: 'checkup'
                    }))
                ];

                if (results.length === 0) {
                    showNotification('No search found!', 'error', true);
                }

                // Update UI with results
                searchResults.innerHTML = results.length > 0
                    ? results.map(result => `
                        <div class="medicine-result-card">
                            <h3 class="medicine-name">${
                                result.source === 'checkup' ? `Dr. ${result.name}` : result.name
                            }</h3>
                            <span class="reminder-type">${
                                result.source === 'expiry' ? 'Medicine Expiry' :
                                result.source === 'prescription' ? 'Prescription Medicine' :
                                'Checkup Reminder'
                            }</span>
                            <div class="result-details">
                                ${result.type ? `<p class="medicine-type">Type: ${result.type}</p>` : ''}
                                ${result.expiry ? `
                                    <p class="expiry-date">Expires on: ${formatDateTime(result.expiry).split(',')[0]}</p>
                                    <p class="days-remaining" style="color: ${calculateDaysRemaining(result.expiry).color} !important">
                                        ${calculateDaysRemaining(result.expiry).message}
                                    </p>
                                ` : ''}
                                ${result.dosage ? `<p class="dosage">Dosage: ${result.dosage}</p>` : ''}
                                ${result.frequency ? `<p class="frequency">Frequency: ${result.frequency}</p>` : ''}
                                ${result.location ? `<p class="location">Location: ${result.location}</p>` : ''}
                                ${result.appointment ? `
                                    <p class="appointment">Appointment: ${result.appointment.replace('T', ' ').slice(0, 16)}</p>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')
                    : '<div class="no-results">No search found!</div>';

            } catch (error) {
                console.error('Search error:', error);
                showNotification('Error searching medicines', 'error', true);
            }
        });

        // Add click handler for search button
        if (searchButton) {
        searchButton.addEventListener('click', () => {
                const event = new Event('input');
                searchInput.dispatchEvent(event);
            });
        }

        // Add Enter key handler
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const event = new Event('input');
                searchInput.dispatchEvent(event);
            }
        });
    }

    // Update the date formatting functions
    function formatTimeForDisplay(timeString) {
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    function formatDateTimeForDB(dateTimeString) {
        // Keep the exact datetime string from the input
        return dateTimeString;
    }

        // Update prescription form handler
    const prescriptionForm = document.getElementById('prescriptionForm');
    prescriptionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const { data: { user }, error: userError } = await dawaSupabase.auth.getUser();
            if (userError) throw userError;

            const formData = new FormData(prescriptionForm);

                // First create the prescription record with basic info
                const prescriptionData = {
                    user_id: user.id,
                    prescription_name: formData.get('prescriptionName'),
                    created_at: new Date().toISOString()
                };

                // Save prescription first and get its ID
            const { data: prescription, error: prescriptionError } = await dawaSupabase
                .from('prescriptions')
                    .insert(prescriptionData)
                .select()
                .single();

            if (prescriptionError) throw prescriptionError;

                // Then create the medicine details
            const medicineData = {
                prescription_id: prescription.id,
                    medicine_name: formData.get('medicineName'),
                dosage: formData.get('dosage'),
                frequency: formData.get('frequency'),
                time_to_take: formData.get('timeToTake'),
                    reminder_preference: formData.get('reminderPreference')
            };

                // Save medicine details
            const { error: medicineError } = await dawaSupabase
                .from('prescription_medicines')
                .insert(medicineData);

            if (medicineError) throw medicineError;

                // Close modal first
            prescriptionForm.reset();
            document.getElementById('prescriptionModal').style.display = 'none';

                // Show first notification
                showNotification('Reminder saved successfully', 'success');

                // Small delay before Google Calendar auth
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    await authenticateGoogleCalendar();
                    
                    // Combine data for calendar event
                    const eventData = {
                        ...medicineData,
                        prescription_name: prescriptionData.prescription_name
                    };
                    
                    const event = createCalendarEvent('prescription', eventData);
                    const response = await gapi.client.calendar.events.insert({
                        calendarId: 'primary',
                        resource: event
                    });

                    if (response.status === 200) {
                        showNotification('Reminder added to Google Calendar', 'success');
                    }

                    // Wait before email
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    const emailSent = await sendConfirmationEmail(user.id, 'prescription', eventData);
                    if (emailSent) {
                        showNotification('Email notification sent successfully', 'success');
                    }

                } catch (calendarError) {
                    console.error('Calendar error:', calendarError);
                    showNotification('Failed to save reminder to Google Calendar', 'error');
                    
                    // Try email even if calendar fails
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    const emailSent = await sendConfirmationEmail(user.id, 'prescription', {
                        ...medicineData,
                        prescription_name: prescriptionData.prescription_name
                    });
                    if (emailSent) {
                        showNotification('Email notification sent successfully', 'success');
                    }
            }

        } catch (error) {
                console.error('Error saving prescription:', error);
                showNotification('Failed to save reminder: ' + error.message, 'error');
        }
    });

        // Update checkup form handler
    const checkupForm = document.getElementById('checkupForm');
    checkupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const { data: { user }, error: userError } = await dawaSupabase.auth.getUser();
            if (userError) throw userError;

            const formData = new FormData(checkupForm);

                const reminderTime = formData.get('reminderTime');
                const customTime = formData.get('customTime');
                const appointmentDateTime = formData.get('appointmentDateTime');

            // Calculate reminder_preference based on selection
            let reminder_preference;
            if (reminderTime === 'custom' && customTime) {
                reminder_preference = customTime;
            } else {
                const appointment = new Date(appointmentDateTime);
                appointment.setDate(appointment.getDate() - 1);
                const timezoneOffset = appointment.getTimezoneOffset();
                appointment.setHours(10, 0, 0, 0);
                appointment.setMinutes(appointment.getMinutes() - timezoneOffset);
                reminder_preference = appointment.toISOString().slice(0, 16);
            }

            const checkupData = {
                user_id: user.id,
                doctor_name: formData.get('doctorName'),
                clinic_location: formData.get('clinicLocation'),
                    appointment_datetime: appointmentDateTime,
                reminder_preference: reminder_preference,
                reminder: false
            };

                // Save to database
            const { error: checkupError } = await dawaSupabase
                .from('checkup')
                .insert(checkupData);

            if (checkupError) throw checkupError;

                // Close modal first
            checkupForm.reset();
            document.getElementById('checkupModal').style.display = 'none';

                // Show first notification
                showNotification('Reminder saved successfully', 'success');

                // Small delay before Google Calendar auth
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    await authenticateGoogleCalendar();
                    
                    // After authentication, create and insert event
                    const event = createCalendarEvent('checkup', checkupData);
                    const response = await gapi.client.calendar.events.insert({
                        calendarId: 'primary',
                        resource: event
                    });

                    if (response.status === 200) {
                        showNotification('Reminder added to Google Calendar', 'success');
                    } else {
                        showNotification('Failed to save reminder to Google Calendar', 'error');
                    }

                    // Wait 3 seconds before email notification
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    // Send email notification
                    const emailSent = await sendConfirmationEmail(user.id, 'checkup', checkupData);
                    if (!emailSent) {
                        showNotification('Failed to send email notification', 'error');
                    } else {
                        showNotification('Email notification sent successfully', 'success');
                    }

                } catch (calendarError) {
                    console.error('Calendar error:', calendarError);
                    showNotification('Failed to save reminder to Google Calendar', 'error');
                    
                    // Still try to send email even if calendar fails
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    const emailSent = await sendConfirmationEmail(user.id, 'checkup', checkupData);
                    if (!emailSent) {
                        showNotification('Failed to send email notification', 'error');
                    } else {
                        showNotification('Email notification sent successfully', 'success');
                    }
                }

        } catch (error) {
                console.error('Error saving checkup reminder:', error);
                showNotification('Failed to save checkup reminder: ' + error.message, 'error', true);
        }
    });

    // Update logout button onclick handler
    logoutBtn.onclick = async () => {
            // Create overlay with initial styles
        const overlay = document.createElement('div');
        overlay.className = 'delete-overlay';
            overlay.style.opacity = '0';
            overlay.style.display = 'block';
        
            // Create confirmation popup with initial styles and positioning
        const confirmation = document.createElement('div');
        confirmation.className = 'delete-confirmation';
            confirmation.style.opacity = '0';
            confirmation.style.transform = 'scale(0.8)';
            confirmation.style.display = 'block';
            confirmation.style.position = 'fixed';
            confirmation.style.top = '50%';
            confirmation.style.left = '50%';
            confirmation.style.transform = 'translate(-50%, -50%) scale(0.8)';
        confirmation.innerHTML = `
            <h3 style="color: var(--danger-color)"><i class="fas fa-sign-out-alt"></i> Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div class="delete-confirmation-buttons">
                <button class="cancel-delete">Cancel</button>
                <button class="confirm-delete" style="background-color: var(--primary-color)">Logout</button>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(overlay);
        document.body.appendChild(confirmation);

            // Trigger smooth animation
        requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                confirmation.style.opacity = '1';
                confirmation.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        // Handle button clicks
        const handleLogout = async () => {
            try {
                    overlay.style.opacity = '0';
                    confirmation.style.opacity = '0';
                    confirmation.style.transform = 'translate(-50%, -50%) scale(0.8)';
                    // Close confirmation dialog and profile modal first
                    const userProfileModal = document.getElementById('userProfileModal');
                    userProfileModal.style.display = 'none';

                    // Wait for animations
                    await new Promise(resolve => setTimeout(resolve, 300));

                    // Remove confirmation dialog
                    document.body.removeChild(overlay);
                    document.body.removeChild(confirmation);

                    // Process logout
                const { error } = await dawaSupabase.auth.signOut();
                if (error) throw error;

                // Show notification
                    showNotification('Logged out successfully!', 'success');

                    // Wait for notification to be visible before redirecting
                setTimeout(() => {
                    window.location.href = 'login.html';
                    }, 2500);

            } catch (error) {
                console.error('Error logging out:', error);
                    showNotification('Failed to log out: ' + error.message, 'error');
                }
        };

        const handleCancel = () => {
                overlay.style.opacity = '0';
                confirmation.style.opacity = '0';
                confirmation.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => {
                document.body.removeChild(overlay);
                document.body.removeChild(confirmation);
            }, 300);
        };

            // Add event listeners
        confirmation.querySelector('.confirm-delete').addEventListener('click', handleLogout);
        confirmation.querySelector('.cancel-delete').addEventListener('click', handleCancel);
        overlay.addEventListener('click', handleCancel);

        // Close on Escape key
        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    };

        // Add medicine expiry form handler
    const expiryForm = document.getElementById('expiryForm');
    expiryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
        try {
            const { data: { user }, error: userError } = await dawaSupabase.auth.getUser();
            if (userError) throw userError;

            const formData = new FormData(expiryForm);

                // Get reminder preference
            const reminderTime = formData.get('reminderTime');
            const customTime = formData.get('customTime');
            const expiryDate = formData.get('expiryDate');

            // Calculate reminder_preference based on selection
            let reminder_preference;
            if (reminderTime === 'custom' && customTime) {
                reminder_preference = customTime;
                } else if (reminderTime === '15days') {
                const expiry = new Date(expiryDate);
                    expiry.setDate(expiry.getDate() - 15);
                reminder_preference = expiry.toISOString().slice(0, 16);
                } else {
                    reminder_preference = expiryDate; // On the date of expiry
            }

                const expiryData = {
                user_id: user.id,
                medicine_name: formData.get('medicineName'),
                medicine_type: formData.get('medicineType'),
                    expiry_date: expiryDate,
                reminder_preference: reminder_preference,
                reminder: false
            };

            // Save to database
            const { error: expiryError } = await dawaSupabase
                .from('medicine_expiry')
                    .insert(expiryData);

            if (expiryError) throw expiryError;

                // Close modal first
            expiryForm.reset();
            document.getElementById('expiryModal').style.display = 'none';

                // Show first notification
                showNotification('Reminder saved successfully', 'success');

                // Small delay before Google Calendar auth
                await new Promise(resolve => setTimeout(resolve, 1000));

                try {
                    await authenticateGoogleCalendar();
                    
                    const event = createCalendarEvent('expiry', expiryData);
                    const response = await gapi.client.calendar.events.insert({
                        calendarId: 'primary',
                        resource: event
                    });

                    if (response.status === 200) {
                        showNotification('Reminder added to Google Calendar', 'success');
                    }

                    // Wait before email
                    await new Promise(resolve => setTimeout(resolve, 3000));

                    const emailSent = await sendConfirmationEmail(user.id, 'expiry', expiryData);
                    if (emailSent) {
                        showNotification('Email notification sent successfully', 'success');
                    }

                } catch (calendarError) {
                    console.error('Calendar error:', calendarError);
                    showNotification('Failed to save reminder to Google Calendar', 'error');
                    
                    // Try email even if calendar fails
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    const emailSent = await sendConfirmationEmail(user.id, 'expiry', expiryData);
                    if (emailSent) {
                        showNotification('Email notification sent successfully', 'success');
                    }
                }

        } catch (error) {
            console.error('Error saving expiry reminder:', error);
                showNotification('Failed to save reminder: ' + error.message, 'error');
            }
        });
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize application', 'error');
    }
});

// Add this constant at the top with other constants
const PRIVACY_POLICY_UPDATE_DATE = '2025-03-21';

// Add this function with other initialization functions
function checkPrivacyPolicyUpdate() {
    const lastViewedDate = localStorage.getItem('lastViewedPrivacyPolicy');
    
    if (!lastViewedDate || new Date(lastViewedDate) < new Date(PRIVACY_POLICY_UPDATE_DATE)) {
        const notification = document.createElement('div');
        notification.className = 'notification privacy-update';
        notification.innerHTML = `
            <span>Our Privacy Policy has been updated. Please review the changes.</span>
            <div class="notification-actions">
                <a href="privacy_policy.html" class="privacy-link">View Changes</a>
                <button class="ignore-btn">Ignore</button>
            </div>
            <i class="fas fa-xmark" style="margin-left: auto; cursor: pointer; font-size: 1.1em; opacity: 0.7;"></i>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Force a reflow to enable the transition
        notification.offsetHeight;

        // Add click handlers
        const closeButton = notification.querySelector('.fa-xmark');
        const ignoreButton = notification.querySelector('.ignore-btn');
        const viewLink = notification.querySelector('.privacy-link');

        const closeNotification = () => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
            localStorage.setItem('lastViewedPrivacyPolicy', new Date().toISOString());
        };

        closeButton.addEventListener('click', closeNotification);
        ignoreButton.addEventListener('click', closeNotification);
        viewLink.addEventListener('click', () => {
            localStorage.setItem('lastViewedPrivacyPolicy', new Date().toISOString());
        });
    }
}

// Add the following CSS classes
const style = document.createElement('style');
style.textContent = `
    .notification.privacy-update {
        background: var(--card-bg);
        border-left: 4px solid var(--primary-color);
        max-width: 420px;
        right: 20px;
        left: auto;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
    .notification.privacy-update span {
        font-size: 0.9em;
        opacity: 0.9;
    }
    .notification-actions {
        display: flex;
        gap: 0.75rem;
        margin-top: 0.5rem;
        font-size: 0.85em;
    }
    .privacy-link {
        color: var(--primary-color);
        text-decoration: none;
        font-weight: 500;
    }
    .privacy-link:hover {
        text-decoration: underline;
    }
    .ignore-btn {
        background: transparent;
        border: none;
        color: var(--text-color);
        opacity: 0.7;
        padding: 0;
        cursor: pointer;
    }
    .ignore-btn:hover {
        opacity: 1;
    }
`;
document.head.appendChild(style);

// Add this line to the initialization code
document.addEventListener('DOMContentLoaded', () => {
    checkPrivacyPolicyUpdate();
});

// Add this at the top of the file with other utility functions
function setButtonLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
        button.classList.add('btn-loading');
        button.disabled = true;
        } else {
        button.classList.remove('btn-loading');
        button.disabled = false;
    }
}

// Update handleFormSubmission function for reminder forms
async function handleFormSubmission(formData, modalId) {
    const modal = document.getElementById(modalId);
    const submitButton = modal.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true);

    try {
        // ... existing form submission logic ...
    } catch (error) {
        console.error('Form submission error:', error);
        showNotification(error.message, 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}
