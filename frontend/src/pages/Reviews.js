import { useState, useEffect } from 'react';
import { reviewsApi } from '../utils/performanceApi';
import { toast } from 'react-toastify';

export default function Reviews() {
    const [activeTab, setActiveTab] = useState('assigned'); // 'assigned', 'cycles', 'templates'
    const [subTab, setSubTab] = useState('not-complete'); // 'not-complete', 'completed'
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch reviews
    const fetchReviews = async () => {
        try {
            setLoading(true);
            let data;
            if (activeTab === 'assigned') {
                data = await reviewsApi.getMyReviews();
            } else {
                data = await reviewsApi.getAllReviews({
                    status: subTab === 'not-complete' ? 'Not complete' : 'Completed',
                });
            }
            // Ensure data is always an array
            if (Array.isArray(data)) {
                setReviews(data);
            } else {
                console.warn('Reviews data is not an array:', data);
                setReviews([]);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            toast.error('Failed to fetch reviews');
            setReviews([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, [activeTab, subTab]);

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'Not complete': 'bg-yellow-100 text-yellow-800',
            'Completed': 'bg-green-100 text-green-800',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    // Filter reviews by sub-tab
    const filteredReviews = Array.isArray(reviews) ? reviews.filter((review) => {
        if (subTab === 'not-complete') {
            return review.status === 'Not complete';
        } else {
            return review.status === 'Completed';
        }
    }) : [];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
            </div>

            {/* Main Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'assigned'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Assigned to me
                    </button>
                    <button
                        onClick={() => setActiveTab('cycles')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'cycles'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Manage cycles
                    </button>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'templates'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Templates
                    </button>
                </div>
            </div>

            {/* Sub Tabs */}
            <div className="bg-white border-b border-gray-200 px-6">
                <div className="flex space-x-6">
                    <button
                        onClick={() => setSubTab('not-complete')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${subTab === 'not-complete'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Not complete
                    </button>
                    <button
                        onClick={() => setSubTab('completed')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${subTab === 'completed'
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Completed
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                    </div>
                ) : filteredReviews.length === 0 ? (
                    /* Empty State */
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 py-16">
                        <div className="text-center">
                            <div className="mx-auto h-24 w-24 mb-4">
                                <svg viewBox="0 0 100 100" className="w-full h-full text-gray-300">
                                    <circle cx="50" cy="70" r="8" fill="currentColor" />
                                    <path
                                        d="M30 45 Q 30 35, 40 35 L 60 35 Q 70 35, 70 45 L 70 55 Q 70 65, 60 65 L 40 65 Q 30 65, 30 55 Z"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                    />
                                    <path d="M 35 45 L 35 50" stroke="currentColor" strokeWidth="2" />
                                    <path d="M 65 45 L 65 50" stroke="currentColor" strokeWidth="2" />
                                    <ellipse cx="50" cy="25" rx="15" ry="8" fill="currentColor" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                No reviews assigned yet
                            </h3>
                            <p className="text-gray-500">
                                Reviews will appear here when goals are created for employees.
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
                                        Review Title
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Manager
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Start Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due By
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredReviews.map((review) => (
                                    <tr key={review._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{review.reviewTitle}</div>
                                            <div className="text-sm text-gray-500">
                                                {review.assignedTo?.firstName} {review.assignedTo?.lastName}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {review.manager?.firstName} {review.manager?.lastName || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(review.startDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(review.dueDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(review.status)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
