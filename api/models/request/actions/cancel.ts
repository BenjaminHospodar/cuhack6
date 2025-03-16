import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";

export const run: ActionRun = async ({ params, record, logger, api, connections, session }) => {
  // First check if the request is in pending status
  if (record.status !== "pending") {
    throw new Error("Only pending requests can be cancelled");
  }

  // Check if current user is the sender of the request
  if (session && session.userId !== record.senderId) {
    throw new Error("Only the sender of a request can cancel it");
  }

  // Set the status to rejected to indicate cancellation
  record.status = "rejected";
  
  // Apply any other params
  applyParams(params, record);
  
  // Ensure tenancy validation
  await preventCrossUserDataAccess(params, record);
  
  // Save the updated record
  await save(record);
  
  return record;
};

export const options: ActionOptions = {
  actionType: "update",
  returnType: true
};
