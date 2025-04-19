import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import EngagementGraph from '../../components/EngagementGraph';

const MetricsScreen = () => {
    const route = useRoute();
    const { productData } = route.params || {};
    const metrics = productData?.metrics || {};
    const resaleValue = metrics?.resaleValue || {};

    // Safe number formatting helper
    const formatNumber = (value, decimals = 2) => {
        const num = Number(value);
        return isNaN(num) ? '0.00' : num.toFixed(decimals);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.searchTermContainer}>
                <Text style={styles.searchTermLabel}>Product:</Text>
                <Text style={styles.searchTerm}>{productData?.description || 'No product description available'}</Text>
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
                        <Text style={[styles.metricValue, styles.profitText]}>
                            {formatNumber(resaleValue.profitMargin, 1)}%
                        </Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Confidence Score:</Text>
                        <Text style={styles.metricValue}>
                            {formatNumber(resaleValue.confidence * 100, 0)}%
                        </Text>
                    </View>
                </View>
            )}

            {metrics?.engagement && (
                <View style={styles.section}>
                    <EngagementGraph engagementData={metrics.engagement} />
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    searchTermContainer: {
        marginBottom: 24,
    },
    searchTermLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        color: '#666',
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
        color: '#34C759',
    },
});

export default MetricsScreen; 