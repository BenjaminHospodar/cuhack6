import { applyParams, save, ActionOptions, InvalidRecordError } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger, session }) => {
  logger.info("Starting userRating create action");
  
  // Apply incoming parameters to the record
  applyParams(params, record);

  // Basic validation for rating value
  if (record.rating !== undefined && (record.rating < 1 || record.rating > 5)) {
    throw new InvalidRecordError("Rating must be between 1 and 5", [
      { apiIdentifier: "rating", message: "Rating must be between 1 and 5" }
    ]);
  }

  // Prevent users from rating themselves
  if (record.raterId && record.ratedId && record.raterId === record.ratedId) {
    throw new InvalidRecordError("Cannot rate yourself", [
      { apiIdentifier: "rated", message: "You cannot rate yourself" }
    ]);
  }
  
  await save(record);
  
  logger.info({ ratingId: record.id }, "Successfully created user rating");
  return record;
};

export const options: ActionOptions = {
  actionType: "create",
  returnType: true,
};