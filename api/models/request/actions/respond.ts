import { applyParams, save, ActionOptions, assert } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";

export const run: ActionRun = async ({ params, record, logger, api, session, sessionID }) => {
  logger.info({ requestId: record.id, params }, "Processing request response");
  
  // Ensure a valid status was provided
  assert(params.status, "Status is required");
  assert(
    params.status === "accepted" || params.status === "rejected",
    "Status must be either 'accepted' or 'rejected'"
  );

  logger.debug({ status: params.status }, "Valid status parameter received");

  // Ensure the request is in pending status
  assert(record.status === "pending", `Request must be in pending status to respond, current status: ${record.status}`);
  logger.debug("Request is in pending status");

  // Enhanced session validation with comprehensive debugging
  let userId: string | undefined;
  
  // Debug log for session inspection
  logger.debug({ 
    sessionExists: !!session,
    sessionID,
    sessionUserId: session?.userId,
    hasUser: !!session?.user
  }, "Session state details");
  
  // Method 1: Get userId from session directly
  if (session?.userId) {
    userId = session.userId;
    logger.debug({ method: "direct", userId }, "Found user ID directly from session");
  } 
  // Method 2: Get userId from session.user if available
  else if (session?.user?.id) {
    userId = session.user.id;
    logger.debug({ method: "user object", userId }, "Found user ID from session.user object");
  } 
  // Method 3: Attempt to get the session via API if we have a sessionID
  else if (sessionID) {
    try {
      logger.debug({ sessionID }, "Attempting to fetch session data using sessionID");
      const sessionData = await api.session.findOne(sessionID, {
        select: {
          id: true,
          user: { id: true }
        }
      });
      
      if (sessionData?.user?.id) {
        userId = sessionData.user.id;
        logger.debug({ method: "api fetch", userId }, "Found user ID by fetching session");
      }
    } catch (error) {
      logger.error({ error, sessionID }, "Error fetching session data");
    }
  }

  // Final authentication check
  if (!userId) {
    logger.error({ 
      sessionExists: !!session,
      sessionID,
      receiverId: record.receiverId
    }, "Failed to determine user ID from any available method");
    throw new Error("Authentication required: Unable to determine your user identity");
  }

  logger.debug({ userId, receiverId: record.receiverId }, "User is authenticated");
  
  // Validate that the current user is the receiver of this request using Gadget's tenancy system
  try {
    await preventCrossUserDataAccess(params, record, {
      userBelongsToField: "receiver"
    });
    logger.debug({ userId, receiverId: record.receiverId }, "User has permission to respond to this request");
  } catch (error) {
    logger.error({ error, userId, receiverId: record.receiverId }, "User is not the receiver of this request");
    throw new Error("You can only respond to requests that were sent to you");
  }

  // Update the request status
  const previousStatus = record.status;
  record.status = params.status;
  logger.info({ 
    requestId: record.id, 
    previousStatus,
    newStatus: record.status,
    userId,
    receiverId: record.receiverId,
    senderId: record.senderId
  }, "Updating request status");
  
  await save(record);
  logger.info({ requestId: record.id }, "Request status updated successfully");
  
  return record;
};

export const params = {
  status: {
    type: "string"
  }
};

export const options: ActionOptions = {
  actionType: "custom",
  returnType: true
};