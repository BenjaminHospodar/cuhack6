import { applyParams, save, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  // Log the incoming parameters for diagnostic purposes
  logger.info({ params }, "Updating user with the following parameters");
  
  // Apply incoming parameters to the record
  applyParams(params, record);
  
  // Log any changes to firstName or lastName specifically
  if (params.user?.firstName !== undefined || params.user?.lastName !== undefined) {
    logger.info({
      firstName: {
        previous: record.changes("firstName")?.previous,
        current: record.firstName
      },
      lastName: {
        previous: record.changes("lastName")?.previous,
        current: record.lastName
      }
    }, "Name fields updated");
  }
  
  // Log all changes to the record
  logger.debug({ changes: record.changes() }, "All changes to be applied");
  
  await save(record);
};

export const options: ActionOptions = {
  actionType: "update",
};