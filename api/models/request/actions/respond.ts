import { applyParams, save, ActionOptions, assert } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";

export const run: ActionRun = async ({ params, record, logger, api, session }) => {
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

  // Ensure the current user is signed in
  if (!session) {
    logger.error("No session found when responding to request");
    throw new Error("You must be signed in to respond to requests");
  }
  
  if (!session.userId) {
    logger.error({ session }, "Session exists but has no userId");
    throw new Error("You must be signed in to respond to requests");
  }

  logger.debug({ userId: session.userId }, "User is signed in");
  
  // Validate that the current user is the receiver of this request using Gadget's tenancy system
  try {
    await preventCrossUserDataAccess(params, record, {
      userBelongsToField: "receiver"
    });
    logger.debug("User has permission to respond to this request");
  } catch (error) {
    logger.error({ error, userId: session.userId, receiverId: record.receiverId }, "User is not the receiver of this request");
    throw new Error("You can only respond to requests that were sent to you");
  }

  // Update the request status
  const previousStatus = record.status;
  record.status = params.status;
  logger.info({ 
    requestId: record.id, 
    previousStatus,
    newStatus: record.status,
    userId: session.userId,
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