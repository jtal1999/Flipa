import { createStackNavigator } from '@react-navigation/stack';
import PhotoSubmissionScreen from './screens/PhotoSubmissionScreen';
import MetricsScreen from './screens/MetricsScreen';
import SavedSearchesScreen from './screens/SavedSearchesScreen';
import TrendingScreen from './screens/TrendingScreen';

const Stack = createStackNavigator();

export default function Navigation() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="PhotoSubmission" 
        component={PhotoSubmissionScreen}
        options={{ title: 'Product Analysis' }}
      />
      <Stack.Screen 
        name="MetricsScreen" 
        component={MetricsScreen}
        options={{ title: 'Analysis Results' }}
      />
      <Stack.Screen 
        name="SavedSearches" 
        component={SavedSearchesScreen}
        options={{ title: 'Saved Searches' }}
      />
      <Stack.Screen 
        name="Trending" 
        component={TrendingScreen}
        options={{ title: 'Trending Products' }}
      />
    </Stack.Navigator>
  );
} 