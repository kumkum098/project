import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Ticket from "@/models/Ticket";
import { TransactionStatus, PaymentStatus, EscrowStatus } from "@/models/Transaction";
import { TicketStatus } from "@/models/Ticket";
import { createSaleNotification, createEscrowNotification } from "@/lib/notifications";

/**
 * Escrow Workflow Management Library
 * 
 * This file contains reusable helper functions that manage the complete
 * transaction lifecycle from purchase to completion.
 * 
 * Transaction Lifecycle:
 * PENDING → IN_ESCROW → TICKET_TRANSFERRED → BUYER_CONFIRMED → COMPLETED
 *                                                    ↓
 *                                                  DISPUTED (if issues)
 * 
 * Each function handles a specific state transition in the escrow workflow.
 */

/**
 * Step 1: Move Transaction to Escrow
 * 
 * Called after payment is successfully processed.
 * Updates the transaction to indicate payment is received and held in escrow.
 * 
 * @param transactionId - The ID of the transaction to move to escrow
 * @returns Promise with success/error message
 */
export async function moveToEscrow(transactionId: string) {
  try {
    // Connect to database
    await connectDB();

    // Validate transaction ID
    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return {
        success: false,
        message: "Invalid transaction ID",
      };
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Check if transaction is in valid state
    if (transaction.transactionStatus !== TransactionStatus.PENDING) {
      return {
        success: false,
        message: `Cannot move to escrow. Current status: ${transaction.transactionStatus}`,
      };
    }

    // Update transaction status
    transaction.paymentStatus = PaymentStatus.PAID;
    transaction.transactionStatus = TransactionStatus.IN_ESCROW;

    // Save changes
    await transaction.save();

    return {
      success: true,
      message: "Transaction moved to escrow successfully",
      transaction: {
        id: transaction._id.toString(),
        paymentStatus: transaction.paymentStatus,
        transactionStatus: transaction.transactionStatus,
      },
    };

  } catch (error) {
    console.error("Error moving transaction to escrow:", error);
    return {
      success: false,
      message: "Failed to move transaction to escrow",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Step 2: Mark Ticket as Transferred by Seller
 * 
 * Called when the seller confirms they have transferred the ticket to the buyer.
 * This could be via email, transfer code, or any delivery method.
 * 
 * @param transactionId - The ID of the transaction
 * @returns Promise with success/error message
 */
export async function markTicketTransferred(
  transactionId: string,
  transferMethod: string,
  transferValue: string
) {
  try {
    // Connect to database
    await connectDB();

    // Validate transaction ID
    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return {
        success: false,
        message: "Invalid transaction ID",
      };
    }

    // Validate transfer payload
    if (!transferMethod || !transferValue) {
      return {
        success: false,
        message: "Transfer method and value are required",
      };
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Check if transaction is in valid state
    if (transaction.transactionStatus !== TransactionStatus.IN_ESCROW) {
      return {
        success: false,
        message: `Cannot mark as transferred. Current status: ${transaction.transactionStatus}. Transaction must be in escrow.`,
      };
    }

    // Update transaction transfer metadata
    transaction.sellerTransferred = true;
    transaction.transferMethod = transferMethod as any;
    transaction.transferValue = transferValue;
    transaction.transferredAt = new Date();
    transaction.transactionStatus = TransactionStatus.TICKET_TRANSFERRED;
    transaction.escrowStatus = EscrowStatus.WAITING_FOR_BUYER_CONFIRMATION;

    // Save changes
    await transaction.save();

    return {
      success: true,
      message: "Ticket marked as transferred successfully",
      transaction: {
        id: transaction._id.toString(),
        sellerTransferred: transaction.sellerTransferred,
        transactionStatus: transaction.transactionStatus,
        transferMethod: transaction.transferMethod,
        transferValue: transaction.transferValue,
        transferredAt: transaction.transferredAt,
        escrowStatus: transaction.escrowStatus,
      },
    };

  } catch (error) {
    console.error("Error marking ticket as transferred:", error);
    return {
      success: false,
      message: "Failed to mark ticket as transferred",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Step 3: Confirm Ticket Received by Buyer
 * 
 * Called when the buyer confirms they have received the ticket.
 * This is a critical step before the transaction can be completed.
 * 
 * @param transactionId - The ID of the transaction
 * @returns Promise with success/error message
 */
export async function confirmTicketReceived(transactionId: string) {
  try {
    // Connect to database
    await connectDB();

    // Validate transaction ID
    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return {
        success: false,
        message: "Invalid transaction ID",
      };
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // If already completed and released, return a no-op success
    if (transaction.escrowStatus === EscrowStatus.COMPLETED) {
      return {
        success: true,
        message: "Ticket receipt already confirmed and escrow already released",
        transaction: {
          id: transaction._id.toString(),
          buyerConfirmed: transaction.buyerConfirmed,
          buyerConfirmedAt: transaction.buyerConfirmedAt,
          transactionStatus: transaction.transactionStatus,
          escrowStatus: transaction.escrowStatus,
          completedAt: transaction.completedAt,
          releasedAt: transaction.releasedAt,
          releaseDate: transaction.releaseDate,
          releasedAmount: transaction.releasedAmount,
          soldAt: transaction.soldAt,
        },
      };
    }

    // Only allow confirmation after ticket transfer or if transaction is ready for release
    if (
      transaction.transactionStatus !== TransactionStatus.TICKET_TRANSFERRED &&
      transaction.escrowStatus !== EscrowStatus.READY_FOR_RELEASE
    ) {
      return {
        success: false,
        message: `Cannot confirm receipt. Current status: ${transaction.transactionStatus}. Ticket must be transferred first.`,
        statusCode: 409,
      };
    }

    const session = await mongoose.startSession();
    let completedTransaction;
    try {
      await session.withTransaction(async () => {
        transaction.buyerConfirmed = true;
        transaction.buyerConfirmedAt = new Date();
        transaction.transactionStatus = TransactionStatus.COMPLETED;
        transaction.escrowStatus = EscrowStatus.COMPLETED;
        transaction.completedAt = new Date();
        transaction.releasedAt = new Date();
        transaction.releaseDate = new Date();
        transaction.releasedAmount = transaction.totalAmount;
        transaction.soldAt = new Date();

        const ticket = await Ticket.findById(transaction.ticketId).session(session);
        if (ticket) {
          ticket.status = TicketStatus.SOLD;
          await ticket.save({ session });
        }

        completedTransaction = await transaction.save({ session });
      });
    } finally {
      session.endSession();
    }

    // Create notifications after the transaction commit
    if (completedTransaction) {
      try {
        await createSaleNotification({
          buyerId: transaction.buyerId.toString(),
          sellerId: transaction.sellerId.toString(),
          ticketId: transaction.ticketId.toString(),
          ticketTitle: transaction.transferValue || "Your ticket",
          transactionId: transaction._id.toString(),
        });

        await createEscrowNotification({
          recipientId: transaction.sellerId.toString(),
          senderId: transaction.buyerId.toString(),
          transactionId: transaction._id.toString(),
          message: `Escrow has been released for transaction ${transaction._id.toString()}. Funds are now available to the seller.`,
        });
      } catch (notificationError) {
        console.error("Error creating confirmation notifications:", notificationError);
      }
    }

    return {
      success: true,
      message: "Ticket receipt confirmed and escrow released successfully",
      transaction: {
        id: transaction._id.toString(),
        buyerConfirmed: transaction.buyerConfirmed,
        buyerConfirmedAt: transaction.buyerConfirmedAt,
        transactionStatus: transaction.transactionStatus,
        escrowStatus: transaction.escrowStatus,
        completedAt: transaction.completedAt,
        releasedAt: transaction.releasedAt,
        releaseDate: transaction.releaseDate,
        releasedAmount: transaction.releasedAmount,
        soldAt: transaction.soldAt,
      },
    };

  } catch (error) {
    console.error("Error confirming ticket receipt:", error);
    return {
      success: false,
      message: "Failed to confirm ticket receipt",
      statusCode: 500,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Step 4: Complete Transaction
 * 
 * Called when both seller has transferred the ticket AND buyer has confirmed receipt.
 * This is the final step in a successful transaction.
 * Updates ticket status to SOLD.
 * 
 * @param transactionId - The ID of the transaction
 * @returns Promise with success/error message
 */
export async function completeTransaction(transactionId: string) {
  try {
    // Connect to database
    await connectDB();

    // Validate transaction ID
    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return {
        success: false,
        message: "Invalid transaction ID",
      };
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Check if both parties have confirmed
    if (!transaction.sellerTransferred) {
      return {
        success: false,
        message: "Cannot complete transaction. Seller has not transferred the ticket yet.",
      };
    }

    if (!transaction.buyerConfirmed) {
      return {
        success: false,
        message: "Cannot complete transaction. Buyer has not confirmed receipt yet.",
      };
    }

    // Check if transaction is in valid state
    if (
      transaction.transactionStatus !== TransactionStatus.TICKET_TRANSFERRED &&
      transaction.transactionStatus !== TransactionStatus.BUYER_CONFIRMED
    ) {
      return {
        success: false,
        message: `Cannot complete transaction. Current status: ${transaction.transactionStatus}`,
      };
    }

    // Update transaction status
    transaction.transactionStatus = TransactionStatus.COMPLETED;

    // Update ticket status to SOLD
    const ticket = await Ticket.findById(transaction.ticketId);
    if (ticket) {
      ticket.status = TicketStatus.SOLD;
      await ticket.save();
    }

    // Save transaction changes
    await transaction.save();

    return {
      success: true,
      message: "Transaction completed successfully",
      transaction: {
        id: transaction._id.toString(),
        transactionStatus: transaction.transactionStatus,
        completedAt: transaction.updatedAt,
      },
      ticket: {
        id: ticket?._id.toString(),
        status: ticket?.status,
      },
    };

  } catch (error) {
    console.error("Error completing transaction:", error);
    return {
      success: false,
      message: "Failed to complete transaction",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Step 5: Raise Dispute
 * 
 * Called when either buyer or seller raises a dispute about the transaction.
 * This pauses the transaction and flags it for admin review.
 * 
 * @param transactionId - The ID of the transaction
 * @param reason - Optional reason for the dispute
 * @returns Promise with success/error message
 */
export async function raiseDispute(transactionId: string, reason?: string) {
  try {
    // Connect to database
    await connectDB();

    // Validate transaction ID
    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return {
        success: false,
        message: "Invalid transaction ID",
      };
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Check if transaction can be disputed
    if (
      transaction.transactionStatus === TransactionStatus.COMPLETED ||
      transaction.transactionStatus === TransactionStatus.CANCELLED
    ) {
      return {
        success: false,
        message: `Cannot raise dispute. Transaction is already ${transaction.transactionStatus}`,
      };
    }

    // Update transaction
    transaction.disputeRaised = true;
    transaction.disputeReason = reason || "No reason provided";
    transaction.disputeCreatedAt = new Date();
    transaction.transactionStatus = TransactionStatus.DISPUTED;
    transaction.escrowStatus = EscrowStatus.ON_HOLD;

    // Save changes
    await transaction.save();

    // Log dispute reason if provided
    if (reason) {
      console.log(`Dispute raised for transaction ${transactionId}: ${reason}`);
      // In a real app, you would save this to a Dispute collection
    }

    return {
      success: true,
      message: "Dispute raised successfully. An admin will review your case.",
      transaction: {
        id: transaction._id.toString(),
        disputeRaised: transaction.disputeRaised,
        transactionStatus: transaction.transactionStatus,
      },
    };

  } catch (error) {
    console.error("Error raising dispute:", error);
    return {
      success: false,
      message: "Failed to raise dispute",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Step 6: Cancel Transaction
 * 
 * Called when a transaction needs to be cancelled.
 * This could be due to:
 * - Buyer cancellation before payment
 * - Seller cancellation
 * - Admin cancellation
 * - Timeout (buyer didn't complete payment)
 * 
 * Resets the ticket status back to AVAILABLE so others can purchase it.
 * 
 * @param transactionId - The ID of the transaction
 * @returns Promise with success/error message
 */
export async function cancelTransaction(transactionId: string) {
  try {
    // Connect to database
    await connectDB();

    // Validate transaction ID
    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return {
        success: false,
        message: "Invalid transaction ID",
      };
    }

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Check if transaction can be cancelled
    if (transaction.transactionStatus === TransactionStatus.COMPLETED) {
      return {
        success: false,
        message: "Cannot cancel completed transaction",
      };
    }

    if (transaction.transactionStatus === TransactionStatus.CANCELLED) {
      return {
        success: false,
        message: "Transaction is already cancelled",
      };
    }

    // Update transaction status
    transaction.transactionStatus = TransactionStatus.CANCELLED;

    // If payment was made, update payment status
    if (transaction.paymentStatus === PaymentStatus.PAID) {
      transaction.paymentStatus = PaymentStatus.REFUNDED;
    }

    // Save transaction changes
    await transaction.save();

    // Update ticket status back to AVAILABLE
    const ticket = await Ticket.findById(transaction.ticketId);
    if (ticket) {
      ticket.status = TicketStatus.ACTIVE;
      await ticket.save();
    }

    return {
      success: true,
      message: "Transaction cancelled successfully. Ticket is now available for purchase.",
      transaction: {
        id: transaction._id.toString(),
        transactionStatus: transaction.transactionStatus,
        paymentStatus: transaction.paymentStatus,
      },
      ticket: {
        id: ticket?._id.toString(),
        status: ticket?.status,
      },
    };

  } catch (error) {
    console.error("Error cancelling transaction:", error);
    return {
      success: false,
      message: "Failed to cancel transaction",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper Function: Get Transaction Status
 * 
 * Returns the current status of a transaction with all details.
 * Useful for displaying transaction progress to users.
 * 
 * @param transactionId - The ID of the transaction
 * @returns Promise with transaction details or error
 */
export async function getTransactionStatus(transactionId: string) {
  try {
    await connectDB();

    if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
      return {
        success: false,
        message: "Invalid transaction ID",
      };
    }

    const transaction = await Transaction.findById(transactionId)
      .populate("buyerId", "name email")
      .populate("sellerId", "name email")
      .populate("ticketId", "title eventName eventDate");

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    return {
      success: true,
      transaction: {
        id: transaction._id.toString(),
        buyer: transaction.buyerId,
        seller: transaction.sellerId,
        ticket: transaction.ticketId,
        amount: transaction.amount,
        platformFee: transaction.platformFee,
        tax: transaction.tax,
        totalAmount: transaction.totalAmount,
        paymentMethod: transaction.paymentMethod,
        paymentStatus: transaction.paymentStatus,
        transactionStatus: transaction.transactionStatus,
        buyerConfirmed: transaction.buyerConfirmed,
        sellerTransferred: transaction.sellerTransferred,
        disputeRaised: transaction.disputeRaised,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    };

  } catch (error) {
    console.error("Error fetching transaction status:", error);
    return {
      success: false,
      message: "Failed to fetch transaction status",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}