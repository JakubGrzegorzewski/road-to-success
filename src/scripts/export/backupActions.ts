import { countRecords, getDoc, getMaps, isDocEmpty } from '@/scripts/store/doc'
import { storeReady } from '@/scripts/store/persistence'
import { getLocal, setLocal } from '@/scripts/store/localState'
import { deliverFile, type DeliverOptions, type DeliveryResult } from '@/scripts/pdf/deliverPdf'
import { exportFileName, exportJsonFile, exportRtsFile, RTS_EXTENSION } from './exportFile'

export const BACKUP_REMINDER_DAYS = 14
const FIRST_REMINDER_AFTER_DAYS = 3
const SNOOZE_DAYS = 3
const DAY = 86_400_000

export async function exportBackup(options: DeliverOptions = {}): Promise<DeliveryResult> {
    const blob = await exportRtsFile()
    const result = await deliverFile(blob, exportFileName(RTS_EXTENSION), { title: 'Road To Success', ...options })
    if (result === 'shared' || result === 'downloaded' || result === 'opened') await setLocal('lastExportAt', Date.now())
    return result
}

export async function exportReadableJson(options: DeliverOptions = {}): Promise<DeliveryResult> {
    return deliverFile(await exportJsonFile(), exportFileName('json'), options)
}

/**
 * Remind about a backup when there is real data and the last export from this device is older
 * than {@link BACKUP_REMINDER_DAYS} (or never happened and the data is a few days old).
 */
export async function shouldRemindAboutBackup(now = Date.now()): Promise<boolean> {
    await storeReady()
    if (isDocEmpty()) return false
    if (countRecords().tasks === 0) return false
    const snoozedUntil = (await getLocal('backupReminderSnoozedUntil')) ?? 0
    if (snoozedUntil > now) return false
    const lastExport = await getLocal('lastExportAt')
    if (lastExport) return now - lastExport > BACKUP_REMINDER_DAYS * DAY
    const createdAt = getMaps(getDoc()).meta.get('createdAt')
    return typeof createdAt === 'number' && now - createdAt > FIRST_REMINDER_AFTER_DAYS * DAY
}

export async function snoozeBackupReminder(now = Date.now()): Promise<void> {
    await setLocal('backupReminderSnoozedUntil', now + SNOOZE_DAYS * DAY)
}
