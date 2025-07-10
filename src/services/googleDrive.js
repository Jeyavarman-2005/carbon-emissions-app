// googleDrive.js
let googleTokenClient;

export function initializeGoogleDriveApi(clientId) {
  return new Promise((resolve, reject) => {
    if (!window.gapi || !window.google) {
      reject("Google libraries not loaded. Add scripts to index.html");
      return;
    }

    window.gapi.load('client:picker', {
      callback: () => {
        googleTokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/drive.file',
          callback: '', // Set later
        });
        resolve();
      },
      onerror: () => reject("Failed to load Google Picker API"),
    });
  });
}

export async function uploadToGoogleDrive(file, fileName) {
  return new Promise((resolve, reject) => {
    googleTokenClient.callback = async (response) => {
      if (response.error) {
        reject(response.error);
        return;
      }

      const metadata = {
        name: fileName,
        mimeType: file.type,
      };

      const formData = new FormData();
      formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
      formData.append('file', file);

      try {
        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${response.access_token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed: ${uploadResponse.statusText}`);
        }

        const fileData = await uploadResponse.json();
        resolve({
          fileId: fileData.id,
          webViewLink: fileData.webViewLink,
        });
      } catch (error) {
        reject(error);
      }
    };

    googleTokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export function createPicker(accessToken, callback) {
  const view = new google.picker.View(google.picker.ViewId.DOCS);
  view.setMimeTypes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

  const picker = new google.picker.PickerBuilder()
    .addView(view)
    .setOAuthToken(accessToken)
    .setCallback(callback)
    .build();

  picker.setVisible(true);
}