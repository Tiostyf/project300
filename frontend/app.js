// frontend/app.js
const API_BASE = window.location.origin + '/api';

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    const currentPage = window.location.pathname.split('/').pop();
    
    // If user is on a protected page but not logged in, redirect to login
    if (['home.html', 'service.html', 'review.html'].includes(currentPage) && !token) {
        window.location.href = 'login.html';
        return;
    }
    
    // If user is logged in, verify token
    if (token) {
        verifyToken(token);
    }
    
    // Set up form submissions
    if (document.getElementById('registerForm')) {
        document.getElementById('registerForm').addEventListener('submit', handleRegister);
    }
    
    if (document.getElementById('loginForm')) {
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }
    
    if (document.getElementById('reviewForm')) {
        document.getElementById('reviewForm').addEventListener('submit', handleReviewSubmit);
        loadReviews();
    }
    
    // Set up logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
});

// Verify JWT token
async function verifyToken(token) {
    try {
        const response = await fetch(`${API_BASE}/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (['home.html', 'service.html', 'review.html'].includes(window.location.pathname.split('/').pop())) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Token verification failed:', error);
    }
}

// Handle user registration
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
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
            localStorage.setItem('user', JSON.stringify({ id: data.userId, name: data.name }));
            showMessage('Registration successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            showMessage(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

// Handle user login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
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
            localStorage.setItem('user', JSON.stringify({ id: data.userId, name: data.name }));
            showMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            showMessage(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

// Handle review submission
async function handleReviewSubmit(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        showMessage('Please log in to submit a review', 'error');
        return;
    }
    
    const name = document.getElementById('reviewName').value;
    const image = document.getElementById('reviewImage').value;
    const description = document.getElementById('reviewDescription').value;
    const rating = document.getElementById('reviewRating').value;
    
    try {
        const response = await fetch(`${API_BASE}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name, image, description, rating })
        });
        
        if (response.ok) {
            showMessage('Review submitted successfully!', 'success');
            document.getElementById('reviewForm').reset();
            loadReviews();
        } else {
            showMessage('Failed to submit review', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

// Load reviews from server
async function loadReviews() {
    try {
        const response = await fetch(`${API_BASE}/reviews`);
        const reviews = await response.json();
        
        const reviewsList = document.getElementById('reviewsList');
        if (reviewsList) {
            reviewsList.innerHTML = '';
            
            if (reviews.length === 0) {
                reviewsList.innerHTML = '<p>No reviews yet. Be the first to share your experience!</p>';
                return;
            }
            
            reviews.forEach(review => {
                const reviewElement = document.createElement('div');
                reviewElement.className = 'review-card';
                
                let stars = '';
                for (let i = 0; i < 5; i++) {
                    stars += i < review.rating ? '★' : '☆';
                }
                
                reviewElement.innerHTML = `
                    <div class="review-header">
                        ${review.image ? `<img src="${review.image}" alt="${review.name}">` : ''}
                        <h4>${review.name}</h4>
                        <div class="rating">${stars}</div>
                    </div>
                    <p>${review.description}</p>
                    <small>${new Date(review.createdAt).toLocaleDateString()}</small>
                `;
                
                reviewsList.appendChild(reviewElement);
            });
        }
    } catch (error) {
        console.error('Failed to load reviews:', error);
    }
}

// Handle user logout
function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Show message to user
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = type;
        messageDiv.classList.remove('hidden');
        
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 3000);
    }
}