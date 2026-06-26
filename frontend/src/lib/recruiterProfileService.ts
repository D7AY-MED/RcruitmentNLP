import { supabase } from './supabase';
import { apiFetch } from './jobPoolService';

export interface RecruiterProfileData {
  full_name?: string;
  phone?: string;
  company_name?: string;
  company_description?: string;
  company_industry?: string;
  company_size?: string;
  company_website?: string;
  company_linkedin_url?: string;
  company_email?: string;
  company_phone?: string;
  company_address?: string;
  company_founded_year?: number;
}

export interface RecruiterProfileRow extends RecruiterProfileData {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Fetch the full hr_profiles row for the given user ID.
 */
export async function fetchRecruiterProfile(
  userId: string
): Promise<RecruiterProfileRow | null> {
  try {
    const data = await apiFetch('/api/v1/recruiter/profile', {
      method: 'GET',
    });
    return data as RecruiterProfileRow;
  } catch (err: any) {
    console.error('fetchRecruiterProfile error:', err.message || err);
    return null;
  }
}

/**
 * Update the hr_profiles row for the given user ID.
 */
export async function updateRecruiterProfile(
  userId: string,
  updates: RecruiterProfileData
): Promise<RecruiterProfileRow | null> {
  const data = await apiFetch('/api/v1/recruiter/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  return data as RecruiterProfileRow;
}

/**
 * Upload a company logo / avatar to the recruiter_avatar bucket.
 * Overwrites any previous avatar for this user.
/**
 * Delete any company logo / avatar for this user.
 */
export async function deleteAvatar(userId: string): Promise<void> {
  if (!supabase) return;

  try {
    const { data: files, error: listError } = await supabase.storage
      .from('recruiter_avatar')
      .list(userId);

    if (listError) throw listError;

    if (files && files.length > 0) {
      const pathsToDelete = files.map((file) => `${userId}/${file.name}`);
      const { error: deleteError } = await supabase.storage
        .from('recruiter_avatar')
        .remove(pathsToDelete);

      if (deleteError) throw deleteError;
    }
  } catch (err: any) {
    console.error('deleteAvatar error:', err.message || err);
  }
}

/**
 * Retrieve the public URL of the user's avatar from the recruiter_avatar bucket using naming convention.
 * Returns null if no avatar is found.
 */
export async function getAvatarUrl(userId: string): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data: files, error } = await supabase.storage
      .from('recruiter_avatar')
      .list(userId);

    if (error) throw error;

    if (files && files.length > 0) {
      const avatarFile = files.find((f) => f.name.startsWith('avatar.'));
      if (avatarFile) {
        const { data: urlData } = supabase.storage
          .from('recruiter_avatar')
          .getPublicUrl(`${userId}/${avatarFile.name}`);
        return urlData.publicUrl;
      }
    }
  } catch (err) {
    console.error('getAvatarUrl error:', err);
  }
  return null;
}

/**
 * Upload a company logo / avatar to the recruiter_avatar bucket.
 * Overwrites any previous avatar for this user.
 * Returns the public URL of the uploaded file.
 */
export async function uploadAvatar(
  userId: string,
  file: File
): Promise<string> {
  if (!supabase) {
    // Demo mode — return a local object URL so the preview still works
    return URL.createObjectURL(file);
  }

  // 1. Delete any existing files in the user's directory first
  await deleteAvatar(userId);

  const ext = file.name.split('.').pop() || 'png';
  const filePath = `${userId}/avatar.${ext}`;

  // 2. Upload
  const { error: uploadError } = await supabase.storage
    .from('recruiter_avatar')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error('uploadAvatar error:', uploadError.message);
    throw new Error(uploadError.message);
  }

  // 3. Get the public URL
  const { data: urlData } = supabase.storage
    .from('recruiter_avatar')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
