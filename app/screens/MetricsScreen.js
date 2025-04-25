import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import EngagementGraph from '../../components/EngagementGraph';
import OrderVolumeDisplay from '../../components/OrderVolumeDisplay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MetricsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { productData } = route.params || {};
    const metrics = productData?.metrics || {};
    const resaleValue = metrics?.resaleValue || {};
    const orderVolume = metrics?.orderVolume || {};
    const engagement = metrics?.engagement || {};
    const [isSaved, setIsSaved] = useState(false);

    // Debug logs
    console.log('Product Data:', productData);
    console.log('Metrics:', metrics);
    console.log('Engagement Data:', engagement);
    console.log('Order Volume:', orderVolume);

    // Safe number formatting helper
    const formatNumber = (value, decimals = 2) => {
        const num = Number(value);
        return isNaN(num) ? '0.00' : num.toFixed(decimals);
    };

    const saveSearch = async () => {
        try {
            const savedSearches = await AsyncStorage.getItem('savedSearches');
            const searches = savedSearches ? JSON.parse(savedSearches) : [];
            
            const newSearch = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                ...productData
            };
            
            searches.push(newSearch);
            await AsyncStorage.setItem('savedSearches', JSON.stringify(searches));
            setIsSaved(true);
            Alert.alert('Success', 'Search saved successfully!');
        } catch (error) {
            console.error('Error saving search:', error);
            Alert.alert('Error', 'Failed to save search');
        }
    };

    return (
        <View style={styles.mainContainer}>
            <ScrollView style={styles.container}>
                <View style={styles.searchTermContainer}>
                    <Text style={styles.searchTermLabel}>Product:</Text>
                    <Text style={styles.searchTerm}>{productData?.description?.toUpperCase() || 'NO PRODUCT DESCRIPTION AVAILABLE'}</Text>
                </View>

                {resaleValue && (
                    <View style={styles.section}>
                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Average Source Price:</Text>
                            <Text style={styles.metricValue}>${formatNumber(resaleValue.aliExpressAverage)}</Text>
                        </View>

                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Average Retail Price:</Text>
                            <Text style={styles.metricValue}>${formatNumber(resaleValue.amazonAverage)}</Text>
                        </View>

                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Potential Profit:</Text>
                            <Text style={[styles.metricValue, styles.profitText]}>
                                ${formatNumber(resaleValue.potentialProfit)}
                            </Text>
                        </View>

                        <View style={styles.metricRow}>
                            <Text style={styles.metricLabel}>Profit Margin:</Text>
                            <View style={styles.meterContainer}>
                                <View 
                                    style={[
                                        styles.meterBar,
                                        { 
                                            width: `${Math.min(resaleValue.profitMargin, 100)}%`,
                                            backgroundColor: '#007AFF'
                                        }
                                    ]}
                                />
                                <Text style={styles.meterText}>{formatNumber(resaleValue.profitMargin, 1)}%</Text>
                        </View>
                        </View>
                    </View>
                )}

                {engagement && Object.keys(engagement).length > 0 && (
                    <View style={styles.section}>
                        <EngagementGraph engagementData={engagement} />
                    </View>
                )}

                {orderVolume && Object.keys(orderVolume).length > 0 && (
                    <View style={styles.section}>
                        <OrderVolumeDisplay orderVolumeData={orderVolume} />
                    </View>
                )}
            </ScrollView>

            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[styles.button, isSaved && styles.savedButton]}
                    onPress={saveSearch}
                    disabled={isSaved}
                >
                    <Text style={styles.buttonText}>
                        {isSaved ? 'Saved' : 'Save'}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => navigation.navigate('SavedSearches')}
                >
                    <Text style={styles.buttonText}>Saved</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.button}
                    onPress={() => navigation.navigate('Trending')}
                >
                    <Text style={styles.buttonText}>Trending</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    searchTermContainer: {
        marginBottom: 24,
    },
    searchTermLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#007AFF',
    },
    searchTerm: {
        fontSize: 18,
        fontWeight: '500',
        color: '#333',
    },
    section: {
        marginBottom: 24,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    metricLabel: {
        fontSize: 16,
        color: '#666',
        flex: 1,
    },
    metricValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    profitText: {
        color: '#007AFF',
    },
    meterContainer: {
        flex: 1,
        height: 24,
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
    },
    meterBar: {
        height: '100%',
        borderRadius: 12,
    },
    meterText: {
        position: 'absolute',
        right: 8,
        top: 0,
        bottom: 0,
        textAlignVertical: 'center',
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    button: {
        backgroundColor: '#007AFF',
        padding: 8,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    savedButton: {
        backgroundColor: '#34C759',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default MetricsScreen; 