import { createStackNavigator } from '@react-navigation/stack';
import PhotoSubmissionScreen from './screens/PhotoSubmissionScreen';
import MetricsScreen from './screens/MetricsScreen';

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
    </Stack.Navigator>
  );
} 