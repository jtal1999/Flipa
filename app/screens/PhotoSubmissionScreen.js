import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';

const API_URL = 'https://c7e4-70-95-61-15.ngrok-free.app/api/upload';

const PhotoSubmissionScreen = () => {
  const navigation = useNavigation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to make this work!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5, // Reduced quality for faster upload
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return;

    setUploading(true);
    try {
      console.log('📝 Creating form data...');
      console.log('📂 Image URI:', selectedImage);
      
      const formData = new FormData();
      
      // Get file extension
      const extension = selectedImage.split('.').pop().toLowerCase();
      
      formData.append('photo', {
        uri: selectedImage,
        type: `image/${extension}`,
        name: `photo.${extension}`,
      });

      console.log('🚀 Starting upload to:', API_URL);
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📦 Response data:', JSON.stringify(data, null, 2));
      
      if (data.success) {
        console.log('✅ Navigating to MetricsScreen with data:', {
          imageUrl: data.filePath,
          description: data.description,
          metrics: data.metrics
        });
        
        navigation.navigate('MetricsScreen', {
          productData: {
            imageUrl: data.filePath,
            description: data.description,
            metrics: data.metrics
          }
        });
      } else {
        alert(data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('❌ Upload error details:', error);
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Upload Product Screenshot</Text>
        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Text style={styles.buttonText}>Select Photo</Text>
        </TouchableOpacity>
        
        {selectedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.image} />
            <TouchableOpacity 
              style={[styles.analyzeButton, uploading && styles.disabledButton]}
              onPress={uploadImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>Analyze Product</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('SavedSearches')}
        >
          <Text style={styles.buttonText}>Saved</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Trending')}
        >
          <Text style={styles.buttonText}>Trending</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  image: {
    width: 300,
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
});

export default PhotoSubmissionScreen; 