import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';

const MetricsScreen = () => {
    const route = useRoute();
    const { productData } = route.params;
    const metrics = productData.metrics;

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.description}>{productData.description}</Text>
            </View>

            {metrics?.resaleValue && (
                <View style={styles.section}>
                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Average Source Price:</Text>
                        <Text style={styles.metricValue}>${metrics.resaleValue.aliExpressAverage.toFixed(2)}</Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Average Retail Price:</Text>
                        <Text style={styles.metricValue}>${metrics.resaleValue.amazonAverage.toFixed(2)}</Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Potential Profit:</Text>
                        <Text style={[styles.metricValue, styles.profitText]}>
                            ${metrics.resaleValue.potentialProfit.toFixed(2)}
                        </Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Profit Margin:</Text>
                        <Text style={[styles.metricValue, styles.profitText]}>
                            {metrics.resaleValue.profitMargin.toFixed(1)}%
                        </Text>
                    </View>

                    <View style={styles.metricRow}>
                        <Text style={styles.metricLabel}>Confidence Score:</Text>
                        <Text style={styles.metricValue}>
                            {(metrics.resaleValue.confidence * 100).toFixed(0)}%
                        </Text>
                    </View>
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