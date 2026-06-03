import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  async sendPushNotification(subscription: any, payload: any) {
    console.log('Push notification sent:', payload);
    return { success: true };
  }

  async sendMessageNotification(subscription: any, data: {
    title: string;
    body: string;
    chatId: string;
    messageId: string;
    senderName: string;
  }) {
    return this.sendPushNotification(subscription, {
      type: 'new_message',
      ...data,
    });
  }

  async sendCallNotification(subscription: any, data: {
    callerName: string;
    callerId: string;
    type: 'voice' | 'video';
    callId: string;
  }) {
    return this.sendPushNotification(subscription, {
      ...data,
      notificationType: 'incoming_call',
    });
  }
}
