import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

const BUCKET = 'case-photos';

/**
 * Launch image picker and return the selected image URI, or null if cancelled.
 */
export async function pickCasePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: true,
    aspect: [3, 4],
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Launch camera and return the captured image URI, or null if cancelled.
 */
export async function takeCasePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: true,
    aspect: [3, 4],
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  return result.assets[0].uri;
}

/**
 * Upload a local image URI to the Supabase `case-photos` storage bucket.
 * Returns the public URL of the uploaded photo.
 *
 * The file is stored as: `<caseId>/<timestamp>_photo.jpg`
 */
export async function uploadCasePhoto(localUri: string, caseId: string): Promise<string> {
  const timestamp = Date.now();
  const filePath = `${caseId}/${timestamp}_photo.jpg`;

  // Fetch the local file as a blob
  const response = await fetch(localUri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    throw new Error(`Photo upload failed: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
