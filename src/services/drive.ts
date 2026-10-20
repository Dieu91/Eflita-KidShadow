/**
 * Google Drive integration service
 * Uploads practice video files to user's Google Drive in "Shadowing Submissions" folder
 */

const FOLDER_NAME = 'Shadowing Submissions';

export interface DriveUploadProgress {
  percent: number;
  status: 'locating_folder' | 'creating_folder' | 'uploading' | 'finishing' | 'done' | 'error';
  message?: string;
}

/**
 * Find existing "Shadowing Submissions" folder or create a new one
 */
export async function getOrCreateSubmissionsFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent(`name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&spaces=drive&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errorText = await searchRes.text();
    throw new Error(`Failed to query Google Drive folder: ${searchRes.status} ${errorText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    throw new Error(`Failed to create "${FOLDER_NAME}" folder: ${createRes.status} ${errorText}`);
  }

  const folderData = await createRes.json();
  return folderData.id;
}

/**
 * Upload a video file to Google Drive folder using Resumable Upload
 * Supports real-time upload progress callback
 */
export async function uploadVideoToDrive(
  accessToken: string,
  file: File,
  lessonTitle: string,
  studentName: string,
  onProgress?: (progress: DriveUploadProgress) => void
): Promise<{ fileId: string; driveLink: string; webViewLink: string }> {
  try {
    onProgress?.({ percent: 10, status: 'locating_folder', message: 'Locating "Shadowing Submissions" folder...' });
    const folderId = await getOrCreateSubmissionsFolder(accessToken);

    onProgress?.({ percent: 25, status: 'uploading', message: 'Initializing upload...' });

    // Format clean filename: [StudentName] - [LessonTitle] - [Timestamp] - [OriginalName]
    const ext = file.name.substring(file.name.lastIndexOf('.')) || '.mp4';
    const timestamp = new Date().toISOString().slice(0, 10);
    const sanitizedStudent = studentName.trim().replace(/[^a-zA-Z0-9\s_-]/g, '') || 'Student';
    const sanitizedTopic = lessonTitle.trim().replace(/[^a-zA-Z0-9\s_-]/g, '') || 'Lesson';
    const fileName = `${sanitizedStudent}_${sanitizedTopic}_${timestamp}${ext}`;

    const metadata = {
      name: fileName,
      parents: [folderId],
      description: `KidShadow practice video for: ${lessonTitle} by ${studentName}`,
    };

    // Step 1: Initiate resumable session
    const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
        'X-Upload-Content-Type': file.type || 'video/mp4',
        'X-Upload-Content-Length': file.size.toString(),
      },
      body: JSON.stringify(metadata),
    });

    if (!initRes.ok) {
      const errorText = await initRes.text();
      throw new Error(`Failed to start Google Drive upload session: ${initRes.status} ${errorText}`);
    }

    const uploadUrl = initRes.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('Google Drive did not return a resumable upload Location header.');
    }

    // Step 2: Upload binary data using XMLHttpRequest to report progress
    const fileResult = await new Promise<{ id: string; webViewLink?: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const currentPercent = 25 + Math.round((event.loaded / event.total) * 65);
          onProgress?.({
            percent: Math.min(currentPercent, 90),
            status: 'uploading',
            message: `Uploading: ${Math.round((event.loaded / (1024 * 1024)) * 10) / 10}MB / ${Math.round((event.total / (1024 * 1024)) * 10) / 10}MB`,
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data);
          } catch {
            resolve({ id: 'uploaded' });
          }
        } else {
          reject(new Error(`Upload failed with HTTP status ${xhr.status}: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error occurred during video upload.'));
      xhr.send(file);
    });

    onProgress?.({ percent: 95, status: 'finishing', message: 'Finalizing file details...' });

    const fileId = fileResult.id;
    // Construct standard web view link
    const webViewLink = fileResult.webViewLink || `https://drive.google.com/file/d/${fileId}/view?usp=drivesdk`;

    onProgress?.({ percent: 100, status: 'done', message: 'Upload completed!' });

    return {
      fileId,
      driveLink: webViewLink,
      webViewLink,
    };
  } catch (error) {
    onProgress?.({ percent: 0, status: 'error', message: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Extract duration of video file in seconds using browser HTML5 video element
 */
export function extractVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        const durationSec = Math.round(video.duration || 0);
        resolve(durationSec);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      };

      // Set timeout in case metadata event never fires
      setTimeout(() => {
        resolve(0);
      }, 4000);

      video.src = objectUrl;
    } catch {
      resolve(0);
    }
  });
}
