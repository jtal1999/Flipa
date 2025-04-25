import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';

const OrderVolumeDisplay = ({ orderVolumeData }) => {
  if (!orderVolumeData) {
    return null;
  }

  const getVolumeColor = (level) => {
    return '#007AFF'; // Use the same blue color as the graph for all levels
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Order Volume Analysis</ThemedText>
        <View 
          style={[
            styles.volumeIndicator, 
            { backgroundColor: getVolumeColor(orderVolumeData.volumeLevel) }
          ]}
        >
          <ThemedText style={styles.volumeText}>
            {orderVolumeData.volumeLevel.toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Average Orders/Listing</ThemedText>
          <ThemedText style={styles.metricValue}>
            {orderVolumeData.metrics.averageOrders.toLocaleString()}
          </ThemedText>
        </View>
        
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Top Listing Orders</ThemedText>
          <ThemedText style={styles.metricValue}>
            {orderVolumeData.metrics.topListingOrders.toLocaleString()}
          </ThemedText>
        </View>
        
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Total Orders (Top 10)</ThemedText>
          <ThemedText style={styles.metricValue}>
            {orderVolumeData.metrics.totalOrders.toLocaleString()}
          </ThemedText>
        </View>
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  volumeIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  volumeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsContainer: {
    marginTop: 8,
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
    marginLeft: 16,
  },
});

export default OrderVolumeDisplay; 