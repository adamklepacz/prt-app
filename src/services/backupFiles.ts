import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { backupFileName } from '../domain/backup';
import { BackupFile } from '../types';

/** Zapisuje backup do pliku tymczasowego i otwiera arkusz udostępniania (AirDrop, Pliki, Mail…). */
export async function shareBackup(backup: BackupFile): Promise<void> {
  const file = new File(Paths.cache, backupFileName(new Date(backup.exportedAt)));
  file.create({ overwrite: true });
  await file.write(JSON.stringify(backup, null, 2));

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Udostępnianie plików nie jest dostępne na tym urządzeniu.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'Eksport danych Somatic',
  });
}

/** Otwiera wybór pliku i zwraca jego treść; null = anulowano. */
export async function pickBackupText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return new File(result.assets[0].uri).text();
}
