import Notification from '#models/notification'

export default class NotificationService {
  public async listUserNotifications(userId: number, page = 1, limit = 10) {
    return await Notification.query()
      .where('recipient_id', userId)
      .orderBy('created_at', 'desc')
      .paginate(page, limit)
  }

  public async createNotification({
    senderId,
    recipientId,
    message,
    type,
  }: {
    senderId: number
    recipientId: number
    message: string
    type: string
  }) {
    return await Notification.create({
      senderId,
      recipientId,
      message,
      type,
      status: 'delivered', // or 'read'
    })
  }

  public async getNotificationById(id: number) {
    const notification = await Notification.find(id)
    if (!notification) throw new Error('Notification not found')
    return notification
  }

  public async updateNotification(id: number, data: any) {
    const notification = await Notification.find(id)
    if (!notification) throw new Error('Notification not found')
    notification.merge(data)
    await notification.save()
    return notification
  }

  public async deleteNotification(id: number) {
    const notification = await Notification.find(id)
    if (!notification) throw new Error('Notification not found')
    await notification.delete()
    return true
  }
}
