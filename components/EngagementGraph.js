import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const EngagementGraph = ({ engagementData }) => {
    const [timePeriod, setTimePeriod] = useState('monthly');
    const screenWidth = Dimensions.get('window').width;

    const getChartData = () => {
        const data = engagementData[timePeriod];
        if (!data || !data.posts || !data.posts.length) return null;

        const posts = data.posts;
        
        // Prepare data for the chart
        const labels = posts.map(post => {
            const date = new Date(post.date);
            switch (timePeriod) {
                case 'day':
                    return `${date.getHours()}:00`;
                case 'week':
                    return `Week of ${date.getMonth() + 1}/${date.getDate()}`;
                case 'monthly':
                default:
                    return `${date.getMonth() + 1}/${date.getFullYear()}`;
            }
        });

        const likesData = posts.map(post => post.likes);
        const commentsData = posts.map(post => post.comments);
        const sharesData = posts.map(post => post.shares);
        const totalEngagementData = posts.map(post => post.totalEngagement);

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
            ]
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Social Media Engagement</Text>
                <View style={styles.timePeriodSelector}>
                    <TouchableOpacity
                        style={[styles.timeButton, timePeriod === 'day' && styles.activeButton]}
                        onPress={() => setTimePeriod('day')}
                    >
                        <Text style={[styles.timeButtonText, timePeriod === 'day' && styles.activeButtonText]}>
                            Day
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.timeButton, timePeriod === 'week' && styles.activeButton]}
                        onPress={() => setTimePeriod('week')}
                    >
                        <Text style={[styles.timeButtonText, timePeriod === 'week' && styles.activeButtonText]}>
                            Week
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.timeButton, timePeriod === 'monthly' && styles.activeButton]}
                        onPress={() => setTimePeriod('monthly')}
                    >
                        <Text style={[styles.timeButtonText, timePeriod === 'monthly' && styles.activeButtonText]}>
                            Month
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <LineChart
                data={chartData}
                width={screenWidth - 40}
                height={220}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    backgroundGradientFrom: '#ffffff',
                    backgroundGradientTo: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                        borderRadius: 16
                    },
                    propsForDots: {
                        r: "4",
                        strokeWidth: "2"
                    },
                    propsForBackgroundLines: {
                        strokeDasharray: "5,5"
                    }
                }}
                bezier
                style={styles.chart}
                withDots={true}
                withInnerLines={true}
                withOuterLines={true}
                withVerticalLines={true}
                withHorizontalLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                yAxisInterval={1}
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

            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Average Likes</Text>
                    <Text style={styles.statValue}>{engagementData[timePeriod].averageLikes}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Average Comments</Text>
                    <Text style={styles.statValue}>{engagementData[timePeriod].averageComments}</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Average Shares</Text>
                    <Text style={styles.statValue}>{engagementData[timePeriod].averageShares}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    timePeriodSelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    timeButton: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 15,
        backgroundColor: '#f0f0f0',
    },
    activeButton: {
        backgroundColor: '#007AFF',
    },
    timeButtonText: {
        color: '#666',
    },
    activeButtonText: {
        color: '#fff',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        marginTop: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 5,
    },
    legendColor: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    noDataText: {
        textAlign: 'center',
        color: '#666',
        marginVertical: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
    },
    statValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default EngagementGraph; 