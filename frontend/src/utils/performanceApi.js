import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5004/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ==================== GOALS API ====================

export const goalsApi = {
    // Get all goals
    getAllGoals: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.assignee && filters.assignee !== 'all') params.append('assignee', filters.assignee);
        if (filters.search) params.append('search', filters.search);

        const response = await api.get(`/performance/goals?${params.toString()}`);
        return response.data;
    },

    // Get my goals
    getMyGoals: async () => {
        const response = await api.get('/performance/goals/my-goals');
        return response.data;
    },

    // Get goal by ID
    getGoalById: async (id) => {
        const response = await api.get(`/performance/goals/${id}`);
        return response.data;
    },

    // Create new goal
    createGoal: async (goalData) => {
        const response = await api.post('/performance/goals', goalData);
        return response.data;
    },

    // Update goal
    updateGoal: async (id, updates) => {
        const response = await api.put(`/performance/goals/${id}`, updates);
        return response.data;
    },

    // Delete goal
    deleteGoal: async (id) => {
        const response = await api.delete(`/performance/goals/${id}`);
        return response.data;
    },
};

// ==================== REVIEWS API ====================

export const reviewsApi = {
    // Get all reviews
    getAllReviews: async (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.status && filters.status !== 'all') params.append('status', filters.status);
        if (filters.assignedTo && filters.assignedTo !== 'all') params.append('assignedTo', filters.assignedTo);

        const response = await api.get(`/performance/reviews?${params.toString()}`);
        return response.data;
    },

    // Get my reviews
    getMyReviews: async () => {
        const response = await api.get('/performance/reviews/my-reviews');
        return response.data;
    },

    // Get review by ID
    getReviewById: async (id) => {
        const response = await api.get(`/performance/reviews/${id}`);
        return response.data;
    },

    // Update review
    updateReview: async (id, updates) => {
        const response = await api.put(`/performance/reviews/${id}`, updates);
        return response.data;
    },

    // Delete review
    deleteReview: async (id) => {
        const response = await api.delete(`/performance/reviews/${id}`);
        return response.data;
    },
};

export default { goalsApi, reviewsApi };
