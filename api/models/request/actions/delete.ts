import { deleteRecord, ActionOptions, InvalidRecordError } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  try {
    logger.debug({
      requestId: record.id,
      senderId: record.senderId,
      receiverId: record.receiverId
    }, "Starting request delete action");
    
    // First validate permissions - specifically check against the sender field
    logger.debug("Validating user permissions for request deletion");
    await preventCrossUserDataAccess(params, record, {
      userBelongsToField: "sender"
    });
    
    logger.debug({ requestId: record.id }, "Permission validation successful, proceeding with deletion");
    
    // Then delete the record if validation passes
    await deleteRecord(record);
    
    logger.debug({ requestId: record.id }, "Request successfully deleted");
    
    return { success: true, requestId: record.id };
  } catch (error) {
    if (error instanceof InvalidRecordError) {
      logger.error({ requestId: record.id, error: error.message }, "Invalid record error when deleting request");
      throw error;
    } else {
      logger.error({ 
        requestId: record.id, 
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack
      }, "Failed to delete request");
      
      // Determine if this is a permission error or something else
      const isPermissionError = error.message?.includes("permission") || 
                               error.message?.includes("access") || 
                               error.message?.includes("unauthorized");
      
      throw new InvalidRecordError("Unable to delete request", [
        { 
          apiIdentifier: "delete", 
          message: isPermissionError 
            ? "You don't have permission to delete this request" 
            : `Error deleting request: ${error.message || "Unknown error"}`
        }
      ]);
    }
  }
};

export const options: ActionOptions = {
  actionType: "delete",
  returnType: true,
};
