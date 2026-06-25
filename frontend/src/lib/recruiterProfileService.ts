import { supabase } from './supabase';

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
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('hr_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('fetchRecruiterProfile error:', error.message);
    return null;
  }
  return data as RecruiterProfileRow;
}

/**
 * Update the hr_profiles row for the given user ID.
 */
export async function updateRecruiterProfile(
  userId: string,
  updates: RecruiterProfileData
): Promise<RecruiterProfileRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('hr_profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('updateRecruiterProfile error:', error.message);
    throw new Error(error.message);
  }
  return data as RecruiterProfileRow;
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

  const ext = file.name.split('.').pop() || 'png';
  const filePath = `${userId}/avatar.${ext}`;

  // Upload (upsert overwrites any previous avatar)
  const { error: uploadError } = await supabase.storage
    .from('recruiter_avatar')
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error('uploadAvatar error:', uploadError.message);
    throw new Error(uploadError.message);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('recruiter_avatar')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
