import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const EngagementGraph = ({ engagementData }) => {
    const [timePeriod, setTimePeriod] = useState('monthly');
    const screenWidth = Dimensions.get('window').width;

    const getChartData = () => {
        const data = engagementData[timePeriod];
        if (!data) return null;

        const posts = data.posts || [];
        
        // If no posts for this period, show averages as single data point
        if (posts.length === 0) {
            return {
                labels: [timePeriod === 'month' ? 'April 2025' : 'All Time'],
                datasets: [
                    {
                        data: [data.averageLikes + data.averageComments + data.averageShares],
                        color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                        strokeWidth: 2
                    },
                    {
                        data: [data.averageLikes],
                        color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
                        strokeWidth: 2
                    },
                    {
                        data: [data.averageComments],
                        color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                        strokeWidth: 2
                    },
                    {
                        data: [data.averageShares],
                        color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
                        strokeWidth: 2
                    }
                ]
            };
        }
        
        // Prepare data for the chart with actual posts
        const labels = posts.map(post => {
            const date = new Date(post.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });

        const likesData = posts.map(post => post.likes);
        const commentsData = posts.map(post => post.comments);
        const sharesData = posts.map(post => post.shares);
        const totalEngagementData = posts.map(post => post.totalEngagement);

        // Find max value for better y-axis scaling
        const maxValue = Math.max(...totalEngagementData);
        const yAxisMax = Math.ceil(maxValue * 1.1); // Add 10% padding

        return {
            labels,
            datasets: [
                {
                    data: totalEngagementData,
                    color: (opacity = 1) => `rgba(255, 0, 0, ${opacity})`,
                    strokeWidth: 2
                },
                {
                    data: likesData,
                    color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
                    strokeWidth: 2
                },
                {
                    data: commentsData,
                    color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
                    strokeWidth: 2
                },
                {
                    data: sharesData,
                    color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
                    strokeWidth: 2
                }
            ],
            yAxisMax
        };
    };

    const chartData = getChartData();

    if (!chartData) {
        return (
            <View style={styles.container}>
                <Text style={styles.noDataText}>No engagement data available</Text>
            </View>
        );
    }

    // Add period indicator
    const periodText = timePeriod === 'month' ? 'April 2025' : 'All Time';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Social Media Engagement</Text>
                <Text style={styles.subtitle}>{periodText}</Text>
                <View style={styles.timePeriodSelector}>
                    <TouchableOpacity
                        style={[styles.timeButton, timePeriod === 'month' && styles.activeButton]}
                        onPress={() => setTimePeriod('month')}
                    >
                        <Text style={[styles.timeButtonText, timePeriod === 'month' && styles.activeButtonText]}>
                            Month
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.timeButton, timePeriod === 'monthly' && styles.activeButton]}
                        onPress={() => setTimePeriod('monthly')}
                    >
                        <Text style={[styles.timeButtonText, timePeriod === 'monthly' && styles.activeButtonText]}>
                            All Time
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <LineChart
                data={chartData}
                width={screenWidth - 32}
                height={220}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                        borderRadius: 16
                    }
                }}
                bezier
                style={{
                    marginVertical: 8,
                    borderRadius: 16
                }}
                withDots={false}
                withShadow={false}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                fromZero={true}
                yAxisInterval={4}
            />

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: 'red' }]} />
                    <Text style={styles.legendText}>Total Engagement</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: 'green' }]} />
                    <Text style={styles.legendText}>Likes</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: 'blue' }]} />
                    <Text style={styles.legendText}>Comments</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: 'orange' }]} />
                    <Text style={styles.legendText}>Shares</Text>
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
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    timePeriodSelector: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
    },
    timeButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 6,
    },
    activeButton: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    timeButtonText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#666',
    },
    activeButtonText: {
        color: '#333',
        fontWeight: '600',
    },
    noDataText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        marginVertical: 20,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        marginBottom: 8,
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
});

export default EngagementGraph; 