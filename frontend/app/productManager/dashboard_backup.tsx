import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useFocusEffect } from 'expo-router';

import Navbar from '../../components/Navbar/Navbar';
import WrappedGeneralButton from '../../components/Buttons/GeneralButtonWithWrapper/GeneralButtonWithWrapper';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTransition } from '../../context/TransitionContext';
import { API_BASE_URL } from '../../constants/API';
import { Colors, Fonts } from '../../constants/theme';
import { Review } from '../../models/BACKEND_MODELS';

export default function PMDashboard() {
    const { token, isAuthenticated, user } = useAuth();
    const { showToast } = useToast();
    const { revealWipe, navigateWithWipe } = useTransition();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pmComments, setPmComments] = useState<Record<string, string>>({});
    
    const authTracker = useRef(isAuthenticated);

    useEffect(() => {
        authTracker.current = isAuthenticated;
    }, [isAuthenticated]);

    useFocusEffect(
        useCallback(() => {
            if (!authTracker.current || user?.role !== 'product_manager') {
                showToast('Access denied. Product Managers only.', 'error');
                navigateWithWipe('/login');
            } else {
                fetchPendingReviews();
                revealWipe();
            }
        }, [user])
    );

    const fetchPendingReviews = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v3/reviews/pending`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setReviews(data.reviews || []);
            } else {
                showToast('Failed to load pending reviews', 'error');
            }
        } catch (error) {
            showToast('Network error loading reviews', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApprove = async (reviewId: string) => {
        setIsLoading(true);
        try {
            const moderationComment = pmComments[reviewId] || '';
            const response = await fetch(`${API_BASE_URL}/api/v3/reviews/${reviewId}/approve`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ moderationComment })
            });

            if (response.ok) {
                showToast('Review approved successfully!', 'success');
                setPmComments(prev => {
                    const newComments = { ...prev };
                    delete newComments[reviewId];
                    return newComments;
                });
                fetchPendingReviews();
            } else {
                showToast('Failed to approve review.', 'error');
            }
        } catch (error) {
            showToast('Network error approving review', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (reviewId: string) => {
        setIsLoading(true);
        try {
            const moderationComment = pmComments[reviewId] || '';
            const response = await fetch(`${API_BASE_URL}/api/v3/reviews/${reviewId}/reject`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ moderationComment })
            });

            if (response.ok) {
                showToast('Review rejected successfully!', 'success');
                setPmComments(prev => {
                    const newComments = { ...prev };
                    delete newComments[reviewId];
                    return newComments;
                });
                fetchPendingReviews();
            } else {
                showToast('Failed to reject review.', 'error');
            }
        } catch (error) {
            showToast('Network error rejecting review', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.mainContainer}>
            <Navbar />

            <ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>

                <Text style={styles.titleText}>COMMENT MODERATION QUEUE</Text>
                
                {reviews.length === 0 && !isLoading && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No pending comments to review!</Text>
                    </View>
                )}

                {reviews.map((review) => (
                    <View key={review.reviewId} style={styles.reviewCard}>
                        
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Product Under Review</Text>
                            <View style={styles.productDetailsGrid}>
                                <View style={styles.detailRow}><Text style={styles.detailLabel}>Product ID:</Text><Text style={styles.detailValue}>{review.productId}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailLabel}>Name:</Text><Text style={styles.detailValue}>{review.productName} {review.productModel ? `(${review.productModel})` : ''}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailLabel}>Seller:</Text><Text style={styles.detailValue}>{review.productSeller || 'Caravan Palace'}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailLabel}>Category:</Text><Text style={styles.detailValue}>{review.productCategory || 'Uncategorized'}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailLabel}>Price:</Text><Text style={styles.detailValue}>{review.productPrice}$</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailLabel}>Stock:</Text><Text style={styles.detailValue}>{review.productStock}</Text></View>
                                <View style={styles.detailRow}><Text style={styles.detailLabel}>Current Status:</Text><Text style={styles.detailValuePending}>Pending</Text></View>
                            </View>

                            <Text style={styles.descriptionLabel}>Product Description:</Text>
                            <Text style={styles.descriptionText}>{review.productDescription || 'No description provided.'}</Text>
                        </View>

                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>Customer Review</Text>
                            <View style={styles.reviewHeader}>
                                <Text style={styles.reviewUser}>{review.userName}</Text>
                                <Text style={styles.reviewDate}>
                                    {new Date(review.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <Text style={styles.reviewRating}>Rating: {review.rating}/5</Text>
                            <Text style={styles.reviewComment}>"{review.commentText}"</Text>
                        </View>

                        <View style={styles.pmCommentContainer}>
                            <Text style={styles.sectionTitle}>Product Manager Decision</Text>
                            <Text style={styles.descriptionLabel}>PM Comment:</Text>
                            <TextInput
                                style={styles.pmCommentInput}
                                multiline
                                placeholder="Explain your decision..."
                                value={pmComments[review.reviewId] || ''}
                                onChangeText={(text) => setPmComments(prev => ({ ...prev, [review.reviewId]: text }))}
                                editable={!isLoading}
                            />
                        </View>

                        <View style={styles.reviewActions}>
                            <WrappedGeneralButton
                                title="Approve"
                                wrapperStyles={styles.approveButtonWrapper}
                                textStyles={styles.actionButtonText}
                                onPress={() => handleApprove(review.reviewId)}
                                disabled={isLoading}
                            />
                            <WrappedGeneralButton
                                title="Reject"
                                wrapperStyles={styles.disapproveButtonWrapper}
                                textStyles={styles.disapproveButtonText}
                                onPress={() => handleReject(review.reviewId)}
                                disabled={isLoading}
                            />
                        </View>

                    </View>
                ))}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: Colors.light.mainBackground,
    },
    contentContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },
    titleText: {
        fontFamily: Fonts.bold,
        fontSize: 28,
        marginBottom: 24,
        marginTop: 20,
        color: Colors.light.mainTextColor,
        textAlign: 'center',
    },
    emptyContainer: {
        marginTop: 60,
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        fontFamily: Fonts.semibold,
        fontSize: 16,
        color: Colors.light.mainTextColor,
        textAlign: 'center',
    },
    reviewCard: {
        width: '100%',
        backgroundColor: Colors.light.softContainerBackground,
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        borderTopWidth: 6,
        borderTopColor: Colors.light.greenButtonBackground,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    sectionContainer: {
        marginBottom: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    sectionTitle: {
        fontFamily: Fonts.bold,
        fontSize: 18,
        color: Colors.light.mainTextColor,
        marginBottom: 16,
    },
    productDetailsGrid: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    detailLabel: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.mainTextColor,
        width: 140,
    },
    detailValue: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.mainTextColor,
        flex: 1,
    },
    detailValuePending: {
        fontFamily: Fonts.bold,
        fontSize: 14,
        color: Colors.light.basePriceTextColor,
        flex: 1,
    },
    descriptionLabel: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.mainTextColor,
        marginBottom: 8,
    },
    descriptionText: {
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.commentTextColor,
        lineHeight: 20,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    reviewUser: {
        fontFamily: Fonts.bold,
        fontSize: 16,
        color: Colors.light.mainTextColor,
    },
    reviewDate: {
        fontFamily: Fonts.regular,
        fontSize: 12,
        color: Colors.light.mainTextColor,
    },
    reviewRating: {
        fontFamily: Fonts.semibold,
        fontSize: 14,
        color: Colors.light.basePriceTextColor,
        marginBottom: 10,
    },
    reviewComment: {
        fontFamily: Fonts.regular,
        fontSize: 15,
        color: Colors.light.commentTextColor,
        marginBottom: 14,
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 8,
        lineHeight: 22,
        borderWidth: 1,
        borderColor: '#eaeaea',
    },
    pmCommentContainer: {
        marginBottom: 20,
    },
    pmCommentInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
        padding: 12,
        height: 80,
        textAlignVertical: 'top',
        fontFamily: Fonts.regular,
        fontSize: 14,
        color: Colors.light.commentTextColor,
    },
    reviewActions: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 12,
    },
    approveButtonWrapper: {
        backgroundColor: Colors.light.greenButtonBackground,
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    disapproveButtonWrapper: {
        backgroundColor: Colors.light.deleteButtonBackground,
        borderRadius: 8,
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    actionButtonText: {
        color: Colors.light.greenButtonTextColor,
        fontFamily: Fonts.bold,
        fontSize: 14,
        textAlign: 'center',
    },
    disapproveButtonText: {
        color: Colors.light.deleteButtonTextColor,
        fontFamily: Fonts.bold,
        fontSize: 14,
        textAlign: 'center',
    }
});
