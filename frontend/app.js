// frontend/app.js
const API_BASE = window.location.origin + '/api';

// Global state
let currentUser = null;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    // Parse user data if available
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
        } catch (e) {
            console.error('Error parsing user data:', e);
            localStorage.removeItem('user');
        }
    }
    
    // Update UI based on authentication status
    updateUIBasedOnAuth(!!token);
    
    // If user is on a protected page but not logged in, redirect to login
    const currentPage = getCurrentPage();
    const protectedPages = ['home', 'service', 'review'];
    
    if (protectedPages.includes(currentPage) && !token) {
        window.location.href = 'login.html';
        return;
    }
    
    // If user is logged in, verify token
    if (token) {
        const isValid = await verifyToken(token);
        if (!isValid && protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
            return;
        }
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load data if on review page
    if (currentPage === 'review') {
        loadReviews();
    }
    
    // Display user info if logged in
    if (currentUser) {
        displayUserInfo();
    }
}

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop().replace('.html', '');
    return page === '' ? 'index' : page;
}

function updateUIBasedOnAuth(isAuthenticated) {
    // Update navigation
    const authElements = document.querySelectorAll('.auth-only');
    const unauthElements = document.querySelectorAll('.unauth-only');
    
    if (isAuthenticated) {
        authElements.forEach(el => el.style.display = 'block');
        unauthElements.forEach(el => el.style.display = 'none');
    } else {
        authElements.forEach(el => el.style.display = 'none');
        unauthElements.forEach(el => el.style.display = 'block');
    }
}

function setupEventListeners() {
    // Set up form submissions
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
    }
    
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }
    
    if (document.getElementById('reviewForm')) {
        document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmit);
    }
    
    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Set up mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }
}

// Verify JWT token
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE}/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            return true;
        } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            currentUser = null;
            updateUIBasedOnAuth(false);
            return false;
        }
    } catch (error) {
        console.error('Token verification failed:', error);
        return false;
    }
}

function displayUserInfo() {
    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(el => {
        el.textContent = currentUser.name;
    });
}

// Handle user registration
async function handleRegister(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    // Get form values
    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Client-side validation
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Disable button to prevent multiple submissions
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
    
    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ 
                id: data.userId, 
                name: data.name,
                email: email
            }));
            currentUser = { id: data.userId, name: data.name, email: email };
            
            showMessage(data.message || 'Registration successful! Redirecting...', 'success');
            updateUIBasedOnAuth(true);
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            showMessage(data.error || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Handle user login
async function handleLogin(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    // Get form values
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    
    // Disable button to prevent multiple submissions
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging In...';
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify({ 
                id: data.userId, 
                name: data.name,
                email: email
            }));
            currentUser = { id: data.userId, name: data.name, email: email };
            
            showMessage(data.message || 'Login successful! Redirecting...', 'success');
            updateUIBasedOnAuth(true);
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            showMessage(data.error || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Handle review submission
async function handleReviewSubmit(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Please log in to submit a review', 'error');
        window.location.href = 'login.html';
        return;
    }
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    
    // Get form values
    const formData = new FormData(form);
    const name = formData.get('name');
    const image = formData.get('image');
    const description = formData.get('description');
    const rating = parseInt(formData.get('rating'));
    
    // Client-side validation
    if (!name || !description || !rating) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }
    
    if (rating < 1 || rating > 5) {
        showMessage('Please select a valid rating', 'error');
        return;
    }
    
    // Disable button to prevent multiple submissions
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting Review...';
    
    try {
        const response = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, image, description, rating })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(data.message || 'Review submitted successfully!', 'success');
            form.reset();
            loadReviews(); // Reload reviews to show the new one
        } else {
            showMessage(data.error || 'Failed to submit review. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Review submission error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        // Re-enable button
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
    }
}

// Load reviews from server
async function loadReviews() {
    try {
        const reviewsContainer = document.getElementById('reviewsList');
        if (!reviewsContainer) return;
        
        // Show loading state
        reviewsContainer.innerHTML = '<div class="loading">Loading reviews...</div>';
        
        const response = await fetch(`${API_BASE}/reviews`);
        const data = await response.json();
        
        if (response.ok) {
            const reviews = data.reviews || [];
            
            if (reviews.length === 0) {
                reviewsContainer.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to share your experience!</p>';
                return;
            }
            
            let reviewsHTML = '';
            reviews.forEach(review => {
                let stars = '';
                for (let i = 0; i < 5; i++) {
                    stars += i < review.rating ? '★' : '☆';
                }
                
                reviewsHTML += `
                    <div class="review-card">
                        <div class="review-header">
                            ${review.image ? `<img src="${review.image}" alt="${review.name}" onerror="this.style.display='none'">` : ''}
                            <div class="review-info">
                                <h4>${review.name}</h4>
                                <div class="rating">${stars}</div>
                            </div>
                        </div>
                        <p class="review-description">${escapeHtml(review.description)}</p>
                        <small class="review-date">${formatDate(review.createdAt)}</small>
                    </div>
                `;
            });
            
            reviewsContainer.innerHTML = reviewsHTML;
        } else {
            reviewsContainer.innerHTML = '<p class="error">Failed to load reviews. Please try again later.</p>';
        }
    } catch (error) {
        console.error('Failed to load reviews:', error);
        const reviewsContainer = document.getElementById('reviewsList');
        if (reviewsContainer) {
            reviewsContainer.innerHTML = '<p class="error">Network error. Please check your connection.</p>';
        }
    }
}

// Handle user logout
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    updateUIBasedOnAuth(false);
    showMessage('Logged out successfully', 'success');
    
    // Redirect to home page if on a protected page
    const currentPage = getCurrentPage();
    const protectedPages = ['home', 'service', 'review'];
    
    if (protectedPages.includes(currentPage)) {
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Show message to user
function showMessage(message, type) {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Add to page
    const header = document.querySelector('header');
    if (header) {
        header.appendChild(messageDiv);
    } else {
        document.body.insertBefore(messageDiv, document.body.firstChild);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Export for testing if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        verifyToken,
        handleRegister,
        handleLogin,
        handleReviewSubmit,
        loadReviews,
        handleLogout
    };
}