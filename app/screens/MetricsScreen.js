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
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    description: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    metricLabel: {
        fontSize: 16,
        color: '#666',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    profitText: {
        color: '#4CAF50',
    }
});

export default MetricsScreen; 