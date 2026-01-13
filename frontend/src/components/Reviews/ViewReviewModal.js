import { useState } from 'react';

export default function ViewReviewModal({ isOpen, onClose, review, isAdmin }) {
    if (!isOpen || !review) return null;

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    };

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

    const getTypeBadge = (type) => {
        const typeColors = {
            'ANNUAL': 'bg-purple-100 text-purple-800',
            'PROBATION': 'bg-orange-100 text-orange-800',
            'AD_HOC': 'bg-teal-100 text-teal-800',
        };
        const typeLabels = {
            'ANNUAL': 'Annual Review',
            'PROBATION': 'Probation Review',
            'AD_HOC': 'Ad-Hoc Review',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeColors[type] || 'bg-gray-100 text-gray-800'}`}>
                {typeLabels[type] || type}
            </span>
        );
    };

    const getRatingStars = (rating) => {
        if (!rating) return null;
        return (
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`h-5 w-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                ))}
                <span className="ml-2 text-sm text-gray-600">({rating}/5)</span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                />

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    {/* Header */}
                    <div className="bg-white px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Performance Review
                                </h3>
                                {getStatusBadge(review.status)}
                                {review.isImmutable && (
                                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                        <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        Locked
                                    </span>
                                )}
                            </div>
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
                    <div className="bg-white px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div className="space-y-6">
                            {/* Basic Info Section */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Review Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-500">Employee:</span>
                                        <p className="font-medium text-gray-900 mt-1">
                                            {review.employee?.firstName} {review.employee?.lastName}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {review.employee?.employeeId}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Review Type:</span>
                                        <div className="mt-1">
                                            {getTypeBadge(review.reviewType)}
                                        </div>
                                    </div>
                                    {(review.reviewPeriodStart || review.reviewPeriodEnd) && (
                                        <div>
                                            <span className="text-gray-500">Review Period:</span>
                                            <p className="font-medium text-gray-900 mt-1">
                                                {formatDate(review.reviewPeriodStart)} - {formatDate(review.reviewPeriodEnd)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-gray-500">Created:</span>
                                        <p className="font-medium text-gray-900 mt-1">
                                            {formatDate(review.createdAt)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            by {review.createdBy?.firstName} {review.createdBy?.lastName}
                                        </p>
                                    </div>
                                    {review.completedAt && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Completed:</span>
                                            <p className="font-medium text-gray-900 mt-1">
                                                {formatDate(review.completedAt)}
                                            </p>
                                            {review.completedBy && (
                                                <p className="text-xs text-gray-500">
                                                    by {review.completedBy.firstName} {review.completedBy.lastName}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Performance Summary */}
                            {review.performanceSummary && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Performance Summary</h4>
                                    <div className="bg-white border border-gray-200 rounded-md p-4">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {review.performanceSummary}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Strengths */}
                            {review.strengths && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Strengths</h4>
                                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {review.strengths}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Areas for Improvement */}
                            {review.improvements && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Areas for Improvement</h4>
                                    <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                            {review.improvements}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Rating */}
                            {review.rating && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Overall Rating</h4>
                                    <div className="bg-white border border-gray-200 rounded-md p-4">
                                        {getRatingStars(review.rating)}
                                    </div>
                                </div>
                            )}

                            {/* Employee Comments Section */}
                            {review.comments && review.comments.length > 0 && (
                                <div className="border-t border-gray-200 pt-6">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Employee Comments</h4>
                                    <div className="space-y-3">
                                        {review.comments.map((comment) => (
                                            <div key={comment._id} className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-medium text-sm mr-2">
                                                            {comment.employee?.firstName?.[0]}{comment.employee?.lastName?.[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {comment.employee?.firstName} {comment.employee?.lastName}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {formatDate(comment.createdAt)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {comment.acknowledged && (
                                                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                            <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                            Acknowledged
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                                    {comment.comment}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Info message for employees */}
                            {!isAdmin && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                    <div className="flex">
                                        <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        <div className="text-sm text-blue-700">
                                            <p className="font-medium">Your Feedback</p>
                                            <p className="mt-1">You can add comments or acknowledgement to this review using the "Add Comment" button from the reviews list.</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-end border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
