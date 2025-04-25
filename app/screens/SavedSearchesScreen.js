import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const SavedSearchesScreen = () => {
  const navigation = useNavigation();
  const [savedSearches, setSavedSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const savedSearchesData = await AsyncStorage.getItem('savedSearches');
      if (savedSearchesData) {
        setSavedSearches(JSON.parse(savedSearchesData));
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (id) => {
    try {
      const updatedSearches = savedSearches.filter(search => search.id !== id);
      await AsyncStorage.setItem('savedSearches', JSON.stringify(updatedSearches));
      setSavedSearches(updatedSearches);
    } catch (error) {
      console.error('Error deleting search:', error);
      Alert.alert('Error', 'Failed to delete search');
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      'Delete Search',
      'Are you sure you want to delete this search?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteSearch(id)
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.searchItem}>
      <TouchableOpacity 
        style={styles.searchContent}
        onPress={() => navigation.navigate('MetricsScreen', { productData: item })}
      >
        <View style={styles.titleRow}>
          <Text style={styles.searchTitle}>{item.description}</Text>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => confirmDelete(item.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#666" />
          </TouchableOpacity>
        </View>
        <Text style={styles.searchDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Saved Searches</Text>
      {savedSearches.length === 0 ? (
        <Text style={styles.emptyText}>No saved searches yet</Text>
      ) : (
        <FlatList
          data={savedSearches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  list: {
    flex: 1,
  },
  searchItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  searchContent: {
    flex: 1,
    paddingTop: 0,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    paddingTop: 0,
  },
  searchDate: {
    fontSize: 14,
    color: '#666',
  },
  deleteButton: {
    padding: 0,
    marginTop: -4,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SavedSearchesScreen; 