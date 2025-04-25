import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const EngagementGraph = ({ engagementData }) => {
    const [selectedPoint, setSelectedPoint] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const screenWidth = Dimensions.get('window').width;
    const chartWidth = screenWidth - 48; // Increased padding for better centering
    const chartRef = useRef(null);

    const getChartData = () => {
        const data = engagementData.monthly;
        if (!data) return null;

        const posts = data.posts || [];
        
        if (posts.length === 0) return null;

        // Find max and min values for scaling
        const maxValue = Math.max(...posts.map(post => post.totalEngagement));
        const minValue = Math.min(...posts.map(post => post.totalEngagement));

        // Convert to logarithmic scale (0-100)
        const scaleValue = (value) => {
            if (value === 0) return 0;
            const logValue = Math.log10(value);
            const logMax = Math.log10(maxValue);
            const logMin = Math.log10(minValue);
            const scaled = ((logValue - logMin) / (logMax - logMin)) * 100;
            return Math.round(scaled);
        };

        // Prepare data for the chart
        const labels = posts.map(() => ''); // Empty labels to remove dates
        const scaledData = posts.map(post => scaleValue(post.totalEngagement));

        return {
            labels,
            datasets: [
                {
                    data: scaledData,
                    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
                    strokeWidth: 2
                }
            ]
        };
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gestureState) => {
                const { moveX } = gestureState;
                const chartX = moveX - 24; // Adjusted for new padding
                
                if (chartX >= 0 && chartX <= chartWidth) {
                    const data = engagementData.monthly.posts;
                    const index = Math.round((chartX / chartWidth) * (data.length - 1));
                    const post = data[index];
                    
                    setSelectedPoint({
                        date: post.date,
                        likes: post.likes,
                        comments: post.comments,
                        shares: post.shares,
                        totalEngagement: post.totalEngagement
                    });
                    
                    setTooltipPosition({
                        x: moveX,
                        y: 0 // Position at the top of the chart
                    });
                }
            },
            onPanResponderRelease: () => {
                // Keep the last selected point visible
            }
        })
    ).current;

    const chartData = getChartData();

    if (!chartData) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>No engagement data available</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Engagement</Text>
            </View>

            <View style={styles.chartWrapper}>
                <View {...panResponder.panHandlers} style={styles.chartContainer}>
            <LineChart
                        ref={chartRef}
                data={chartData}
                        width={chartWidth}
                height={220}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                        borderRadius: 16
                    }
                }}
                bezier
                style={{
                    marginVertical: 8,
                            borderRadius: 16,
                            paddingRight: 20
                }}
                        withDots={true}
                withShadow={false}
                        withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                        withHorizontalLabels={false}
                fromZero={true}
                        yAxisInterval={20}
                        segments={5}
                        formatYLabel={(value) => Math.round(value).toString()}
                        yLabelsOffset={10}
                    />
                    {selectedPoint && (
                        <View 
                            style={[
                                styles.verticalLine,
                                {
                                    left: tooltipPosition.x - 24, // Adjusted for new padding
                                }
                            ]}
                        />
                    )}
                </View>
                </View>

            {selectedPoint && (
                <View 
                    style={[
                        styles.tooltip,
                        {
                            position: 'absolute',
                            left: tooltipPosition.x - 75, // Center the tooltip
                            top: tooltipPosition.y
                        }
                    ]}
                >
                    <Text style={styles.tooltipText}>Date: {selectedPoint.date}</Text>
                    <Text style={styles.tooltipText}>Likes: {selectedPoint.likes}</Text>
                    <Text style={styles.tooltipText}>Comments: {selectedPoint.comments}</Text>
                    <Text style={styles.tooltipText}>Shares: {selectedPoint.shares}</Text>
                </View>
            )}

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#007AFF' }]} />
                    <Text style={styles.legendText}>Engagement Score (0-100)</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginVertical: 20,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    tooltip: {
        backgroundColor: 'rgba(248, 248, 248, 0.8)',
        padding: 8,
        borderRadius: 8,
        width: 150,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tooltipText: {
        fontSize: 10,
        color: '#333',
        marginBottom: 2,
    },
    chartWrapper: {
        alignItems: 'center',
    },
    chartContainer: {
        position: 'relative',
    },
    verticalLine: {
        position: 'absolute',
        width: 2,
        height: 220,
        backgroundColor: '#007AFF',
        opacity: 0.5,
    },
});

export default EngagementGraph; 