import { connectDB } from "./mongodb";
import Notification, { NotificationType } from "@/models/Notification";

/**
 * Creates a notification for a user
 * 
 * @param recipientId - User ID who will receive the notification
 * @param title - Notification title
 * @param message - Notification message
 * @param type - Type of notification
 * @param senderId - User ID who triggered the notification (optional)
 * @param link - Optional link to navigate to when clicked
 * @param metadata - Optional additional data
 */
export async function createNotification(
  recipientId: string,
  title: string,
  message: string,
  type: NotificationType,
  senderId?: string,
  link?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await connectDB();

    await Notification.create({
      recipientId: new (await import("mongoose")).default.Types.ObjectId(recipientId),
      senderId: senderId ? new (await import("mongoose")).default.Types.ObjectId(senderId) : undefined,
      title,
      message,
      type,
      link,
      metadata,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
}

/**
 * Creates notification for ticket listed
 */
export async function notifyTicketListed(
  sellerId: string,
  ticketId: string,
  ticketTitle: string
): Promise<void> {
  await createNotification(
    sellerId,
    "Ticket Listed",
    `Your ticket "${ticketTitle}" has been listed successfully`,
    NotificationType.SALE,
    undefined,
    `/tickets/${ticketId}`
  );
}

/**
 * Creates notification for ticket purchased
 */
export async function notifyTicketPurchased(
  buyerId: string,
  sellerId: string,
  ticketId: string,
  ticketTitle: string
): Promise<void> {
  // Notify buyer
  await createNotification(
    buyerId,
    "Ticket Purchased",
    `You have successfully purchased "${ticketTitle}"`,
    NotificationType.PURCHASE,
    sellerId,
    `/tickets/${ticketId}`
  );

  // Notify seller
  await createNotification(
    sellerId,
    "Ticket Sold",
    `Your ticket "${ticketTitle}" has been purchased`,
    NotificationType.SALE,
    buyerId,
    `/tickets/${ticketId}`
  );
}

/**
 * Creates notification for payment successful
 */
export async function notifyPaymentSuccessful(
  userId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  await createNotification(
    userId,
    "Payment Successful",
    `Your payment of ₹${amount.toLocaleString()} has been processed successfully`,
    NotificationType.PAYMENT,
    undefined,
    `/transactions/${transactionId}`
  );
}

/**
 * Creates notification for escrow started
 */
export async function notifyEscrowStarted(
  buyerId: string,
  sellerId: string,
  transactionId: string
): Promise<void> {
  await createNotification(
    sellerId,
    "Escrow Started",
    "Payment has been received and held in escrow. Please transfer the ticket to the buyer.",
    NotificationType.ESCROW,
    buyerId,
    `/transactions/${transactionId}`
  );
}

/**
 * Creates notification for ticket transferred
 */
export async function notifyTicketTransferred(
  buyerId: string,
  sellerId: string,
  transactionId: string
): Promise<void> {
  await createNotification(
    buyerId,
    "Ticket Transferred",
    "The seller has transferred the ticket. Please confirm receipt.",
    NotificationType.ESCROW,
    sellerId,
    `/transactions/${transactionId}`
  );
}

/**
 * Creates notification for buyer confirmation
 */
export async function notifyBuyerConfirmed(
  sellerId: string,
  transactionId: string
): Promise<void> {
  await createNotification(
    sellerId,
    "Buyer Confirmed",
    "The buyer has confirmed receipt of the ticket. Funds will be released soon.",
    NotificationType.ESCROW,
    undefined,
    `/transactions/${transactionId}`
  );
}

/**
 * Creates notification for escrow released
 */
export async function notifyEscrowReleased(
  sellerId: string,
  transactionId: string,
  amount: number
): Promise<void> {
  await createNotification(
    sellerId,
    "Payment Released",
    `₹${amount.toLocaleString()} has been released from escrow to your account`,
    NotificationType.PAYMENT,
    undefined,
    `/transactions/${transactionId}`
  );
}

/**
 * Creates notification for transaction completed
 */
export async function notifyTransactionCompleted(
  buyerId: string,
  sellerId: string,
  transactionId: string
): Promise<void> {
  await createNotification(
    buyerId,
    "Transaction Completed",
    "Your transaction has been completed successfully",
    NotificationType.SYSTEM,
    sellerId,
    `/transactions/${transactionId}`
  );

  await createNotification(
    sellerId,
    "Transaction Completed",
    "Your transaction has been completed successfully",
    NotificationType.SYSTEM,
    buyerId,
    `/transactions/${transactionId}`
  );
}

/**
 * Creates notification for new message received
 */
export async function notifyNewMessage(
  receiverId: string,
  senderId: string,
  senderName: string,
  transactionId: string,
  messagePreview: string
): Promise<void> {
  await createNotification(
    receiverId,
    `New message from ${senderName}`,
    messagePreview.substring(0, 100),
    NotificationType.SYSTEM,
    senderId,
    `/messages/${transactionId}`
  );
}

/**
 * Creates notification for wishlist item sold
 */
export async function notifyWishlistItemSold(
  userId: string,
  ticketId: string,
  ticketTitle: string
): Promise<void> {
  await createNotification(
    userId,
    "Ticket Sold",
    `A ticket in your wishlist "${ticketTitle}" has been sold`,
    NotificationType.SALE,
    undefined,
    `/tickets/${ticketId}`
  );
}

/**
 * Creates notification for ticket verification approved
 */
export async function notifyVerificationApproved(
  sellerId: string,
  ticketId: string,
  ticketTitle: string
): Promise<void> {
  await createNotification(
    sellerId,
    "Verification Approved",
    `Your ticket "${ticketTitle}" has been verified and approved`,
    NotificationType.VERIFICATION,
    undefined,
    `/tickets/${ticketId}`
  );
}

/**
 * Creates notification for ticket verification rejected
 */
export async function notifyVerificationRejected(
  sellerId: string,
  ticketId: string,
  ticketTitle: string,
  reason: string
): Promise<void> {
  await createNotification(
    sellerId,
    "Verification Rejected",
    `Your ticket "${ticketTitle}" verification was rejected. Reason: ${reason}`,
    NotificationType.VERIFICATION,
    undefined,
    `/tickets/${ticketId}`
  );
}

/**
 * Creates admin announcement notification
 */
export async function notifyAdminAnnouncement(
  userId: string,
  title: string,
  message: string,
  link?: string
): Promise<void> {
  await createNotification(
    userId,
    title,
    message,
    NotificationType.SYSTEM,
    undefined,
    link
  );
}

/**
 * Creates sale notification for both buyer and seller
 */
export async function createSaleNotification(params: {
  buyerId: string;
  sellerId: string;
  ticketId: string;
  ticketTitle: string;
  transactionId: string;
}): Promise<void> {
  const { buyerId, sellerId, ticketId, ticketTitle, transactionId } = params;

  // Notify buyer
  await createNotification(
    buyerId,
    "Ticket Purchase Confirmed",
    `Your purchase of "${ticketTitle}" has been confirmed`,
    NotificationType.PURCHASE,
    sellerId,
    `/tickets/${ticketId}`
  );

  // Notify seller
  await createNotification(
    sellerId,
    "Ticket Sold",
    `Your ticket "${ticketTitle}" has been sold`,
    NotificationType.SALE,
    buyerId,
    `/tickets/${ticketId}`
  );
}

/**
 * Creates escrow release notification
 */
export async function createEscrowNotification(params: {
  recipientId: string;
  senderId: string;
  transactionId: string;
  message: string;
}): Promise<void> {
  const { recipientId, senderId, transactionId, message } = params;

  await createNotification(
    recipientId,
    "Escrow Released",
    message,
    NotificationType.PAYMENT,
    senderId,
    `/transactions/${transactionId}`
  );
}
