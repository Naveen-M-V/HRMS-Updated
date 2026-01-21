import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5003/api';

export default function CommentReviewModal({ isOpen, onClose, onSuccess, review }) {
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);

    // Populate existing comment if available
    useEffect(() => {
        if (review && review.myComment) {
            setComment(review.myComment.comment || '');
            setAcknowledged(review.myComment.acknowledged || false);
        } else {
            setComment('');
            setAcknowledged(false);
        }
    }, [review]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!comment.trim()) {
            toast.error('Please enter a comment');
            return;
        }

        if (comment.length > 2000) {
            toast.error('Comment cannot exceed 2000 characters');
            return;
        }

        try {
            setLoading(true);
            
            await axios.post(`${API_BASE}/reviews/${review._id}/comment`, {
                comment: comment.trim(),
                acknowledged
            }, {
                withCredentials: true
            });
            
            toast.success('Comment added successfully');
            onSuccess();
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error(error.response?.data?.message || 'Failed to add comment');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !review) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">
                                Add Your Feedback
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-6 py-4">
                            <div className="space-y-4">
                                {/* Review Info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <p className="text-sm text-gray-500">Review for:</p>
                                    <p className="text-base font-medium text-gray-900 mt-1">
                                        {review.employee?.firstName} {review.employee?.lastName}
                                    </p>
                                    <div className="mt-2 flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            review.reviewType === 'ANNUAL' ? 'bg-purple-100 text-purple-800' :
                                            review.reviewType === 'PROBATION' ? 'bg-orange-100 text-orange-800' :
                                            'bg-teal-100 text-teal-800'
                                        }`}>
                                            {review.reviewType === 'ANNUAL' ? 'Annual' : 
                                             review.reviewType === 'PROBATION' ? 'Probation' : 'Ad-Hoc'} Review
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            review.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {review.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Comment Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Your Comment <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={6}
                                        maxLength={2000}
                                        placeholder="Share your thoughts on this performance review..."
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                        required
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        {comment.length}/2000 characters
                                    </p>
                                </div>

                                {/* Acknowledgement Checkbox */}
                                <div className="flex items-start">
                                    <div className="flex items-center h-5">
                                        <input
                                            type="checkbox"
                                            checked={acknowledged}
                                            onChange={(e) => setAcknowledged(e.target.checked)}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        />
                                    </div>
                                    <div className="ml-3">
                                        <label className="text-sm text-gray-700">
                                            I acknowledge that I have read and understood this performance review
                                        </label>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                    <div className="flex">
                                        <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className="text-sm text-blue-700">
                                            <p className="font-medium mb-1">About Your Feedback</p>
                                            <ul className="list-disc list-inside space-y-1 text-xs">
                                                <li>Your comment will be visible to your manager and HR</li>
                                                <li>You can update your comment at any time</li>
                                                <li>Your feedback becomes part of the permanent review record</li>
                                                <li>You cannot edit the performance feedback written by management</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {review.myComment && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                                        <div className="flex">
                                            <svg className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-sm text-yellow-700">
                                                You already have a comment on this review. Submitting this form will update your previous comment.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : review.myComment ? 'Update Comment' : 'Add Comment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
