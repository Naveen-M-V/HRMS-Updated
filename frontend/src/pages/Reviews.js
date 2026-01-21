import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import CreateReviewModal from '../components/Reviews/CreateReviewModal';
import ViewReviewModal from '../components/Reviews/ViewReviewModal';
import CommentReviewModal from '../components/Reviews/CommentReviewModal';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5003/api';

export default function Reviews() {
    // State
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'DRAFT', 'SUBMITTED', 'COMPLETED'
    const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'ANNUAL', 'PROBATION', 'AD_HOC'
    
    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showCommentModal, setShowCommentModal] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [editingReview, setEditingReview] = useState(null);

    // Check if user is admin
    const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'admin' || userRole === 'super-admin';

    // Fetch current user
    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await axios.get(`${API_BASE}/auth/me`, {
                    withCredentials: true
                });
                setUserRole(response.data.role?.toUpperCase());
                setCurrentUser(response.data);
            } catch (error) {
                console.error('Error fetching current user:', error);
            }
        };
        fetchCurrentUser();
    }, []);

    // Fetch reviews
    const fetchReviews = async () => {
        try {
            setLoading(true);
            
            let endpoint = isAdmin ? '/api/reviews' : '/api/reviews/my/list';
            const params = new URLSearchParams();
            
            if (isAdmin) {
                if (statusFilter !== 'all') params.append('status', statusFilter);
                if (typeFilter !== 'all') params.append('reviewType', typeFilter);
            }
            
            const url = params.toString() ? `${endpoint}?${params}` : endpoint;
            
            const response = await axios.get(`${API_BASE}${url}`, {
                withCredentials: true
            });
            
            setReviews(response.data.reviews || []);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to load reviews');
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userRole) {
            fetchReviews();
        }
    }, [userRole, statusFilter, typeFilter]);

    // Handle create review
    const handleCreateReview = () => {
        setEditingReview(null);
        setShowCreateModal(true);
    };

    // Handle edit review
    const handleEditReview = (review) => {
        if (review.status !== 'DRAFT') {
            toast.error('Only draft reviews can be edited');
            return;
        }
        setEditingReview(review);
        setShowCreateModal(true);
    };

    // Handle view review
    const handleViewReview = async (review) => {
        try {
            const response = await axios.get(`${API_BASE}/reviews/${review._id}`, {
                withCredentials: true
            });
            setSelectedReview(response.data.review);
            setShowViewModal(true);
        } catch (error) {
            console.error('Error fetching review details:', error);
            toast.error('Failed to load review details');
        }
    };

    // Handle submit review
    const handleSubmitReview = async (reviewId) => {
        if (!window.confirm('Submit this review? The employee will be able to view it after submission.')) {
            return;
        }
        
        try {
            await axios.post(`${API_BASE}/reviews/${reviewId}/submit`, {}, {
                withCredentials: true
            });
            toast.success('Review submitted successfully');
            fetchReviews();
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error(error.response?.data?.message || 'Failed to submit review');
        }
    };

    // Handle complete review
    const handleCompleteReview = async (reviewId) => {
        if (!window.confirm('Complete this review? This will make it a permanent, immutable record.')) {
            return;
        }
        
        try {
            await axios.post(`${API_BASE}/reviews/${reviewId}/complete`, {}, {
                withCredentials: true
            });
            toast.success('Review completed successfully');
            fetchReviews();
        } catch (error) {
            console.error('Error completing review:', error);
            toast.error(error.response?.data?.message || 'Failed to complete review');
        }
    };

    // Handle delete review
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Delete this review? This action cannot be undone.')) {
            return;
        }
        
        try {
            await axios.delete(`${API_BASE}/reviews/${reviewId}`, {
                withCredentials: true
            });
            toast.success('Review deleted successfully');
            fetchReviews();
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error(error.response?.data?.message || 'Failed to delete review');
        }
    };

    // Handle add comment
    const handleAddComment = (review) => {
        setSelectedReview(review);
        setShowCommentModal(true);
    };

    // Format date
    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const statusColors = {
            'DRAFT': 'bg-gray-100 text-gray-800',
            'SUBMITTED': 'bg-blue-100 text-blue-800',
            'COMPLETED': 'bg-green-100 text-green-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    // Get review type badge
    const getTypeBadge = (type) => {
        const typeColors = {
            'ANNUAL': 'bg-purple-100 text-purple-800',
            'PROBATION': 'bg-orange-100 text-orange-800',
            'AD_HOC': 'bg-teal-100 text-teal-800',
        };
        const typeLabels = {
            'ANNUAL': 'Annual',
            'PROBATION': 'Probation',
            'AD_HOC': 'Ad-Hoc',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
                {typeLabels[type] || type}
            </span>
        );
    };

    if (loading && !userRole) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {isAdmin ? 'Manage formal employee performance reviews' : 'View your performance reviews and provide feedback'}
                        </p>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={handleCreateReview}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Review
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center space-x-4">
                    {isAdmin && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="block w-40 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="DRAFT">Draft</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                <select
                                    value={typeFilter}
                                    onChange={(e) => setTypeFilter(e.target.value)}
                                    className="block w-40 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 rounded-md"
                                >
                                    <option value="all">All Types</option>
                                    <option value="ANNUAL">Annual</option>
                                    <option value="PROBATION">Probation</option>
                                    <option value="AD_HOC">Ad-Hoc</option>
                                </select>
                            </div>
                        </>
                    )}
                    <div className="flex-1"></div>
                    <div className="text-sm text-gray-500">
                        {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : reviews.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 py-16">
                        <div className="text-center">
                            <div className="mx-auto h-24 w-24 mb-4">
                                <svg viewBox="0 0 100 100" className="w-full h-full text-gray-300">
                                    <path
                                        d="M30 35 h40 v5 h-40 z M30 45 h30 v4 h-30 z M30 55 h35 v4 h-35 z"
                                        fill="currentColor"
                                    />
                                    <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="3" rx="3" />
                                    <path d="M60 15 L70 25 L60 25 Z" fill="currentColor" />
                                    <line x1="65" y1="15" x2="65" y2="25" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {isAdmin ? 'No reviews created yet' : 'No reviews available'}
                            </h3>
                            <p className="text-gray-500">
                                {isAdmin 
                                    ? 'Create your first performance review to get started.'
                                    : 'Your performance reviews will appear here once they are submitted.'}
                            </p>
                        </div>
                    </div>
                ) : (
                    /* Reviews Table */
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Employee
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Review Period
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    {!isAdmin && (
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            My Action
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reviews.map((review) => (
                                    <tr key={review._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {review.employee?.firstName} {review.employee?.lastName}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {review.employee?.employeeId}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getTypeBadge(review.reviewType)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {review.reviewPeriodStart && review.reviewPeriodEnd ? (
                                                <div>
                                                    {formatDate(review.reviewPeriodStart)} - {formatDate(review.reviewPeriodEnd)}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(review.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(review.createdAt)}
                                        </td>
                                        {!isAdmin && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {review.acknowledged ? (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                        Acknowledged
                                                    </span>
                                                ) : review.hasCommented ? (
                                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                        Commented
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No action yet</span>
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {isAdmin ? (
                                                <>
                                                    <button
                                                        onClick={() => handleViewReview(review)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View
                                                    </button>
                                                    {review.status === 'DRAFT' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditReview(review)}
                                                                className="text-green-600 hover:text-green-900"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleSubmitReview(review._id)}
                                                                className="text-purple-600 hover:text-purple-900"
                                                            >
                                                                Submit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteReview(review._id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                    {review.status === 'SUBMITTED' && (
                                                        <button
                                                            onClick={() => handleCompleteReview(review._id)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Complete
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleViewReview(review)}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => handleAddComment(review)}
                                                        className="text-green-600 hover:text-green-900"
                                                    >
                                                        {review.hasCommented ? 'Update' : 'Add'} Comment
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <CreateReviewModal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingReview(null);
                    }}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        setEditingReview(null);
                        fetchReviews();
                    }}
                    editingReview={editingReview}
                />
            )}

            {showViewModal && selectedReview && (
                <ViewReviewModal
                    isOpen={showViewModal}
                    onClose={() => {
                        setShowViewModal(false);
                        setSelectedReview(null);
                    }}
                    review={selectedReview}
                    isAdmin={isAdmin}
                />
            )}

            {showCommentModal && selectedReview && (
                <CommentReviewModal
                    isOpen={showCommentModal}
                    onClose={() => {
                        setShowCommentModal(false);
                        setSelectedReview(null);
                    }}
                    onSuccess={() => {
                        setShowCommentModal(false);
                        setSelectedReview(null);
                        fetchReviews();
                    }}
                    review={selectedReview}
                />
            )}
        </div>
    );
}
