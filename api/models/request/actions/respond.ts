import { applyParams, save, ActionOptions, assert } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";

export const run: ActionRun = async ({ params, record, logger, api, session }) => {
  // Ensure a valid status was provided
  assert(params.status, "Status is required");
  assert(
    params.status === "accepted" || params.status === "rejected",
    "Status must be either 'accepted' or 'rejected'"
  );

  // Ensure the request is in pending status
  assert(record.status === "pending", "Request must be in pending status to respond");

  // Ensure the current user is the receiver of this request
  assert(session?.userId, "User must be signed in to respond to requests");
  assert(
    record.receiverId === session.userId,
    "Only the receiver of this request can respond to it"
  );

  // Update the request status
  record.status = params.status;
  
  await save(record);
  
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