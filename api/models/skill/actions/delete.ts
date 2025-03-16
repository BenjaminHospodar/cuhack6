import { deleteRecord, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  // Check if any userSkill records reference this skill
  const userSkills = await api.userSkill.findMany({
    filter: {
      skillId: {
        equals: record.id
      }
    },
    first: 1 // We only need to know if any exist, not the full list
  });

  // If there are any userSkill records, prevent deletion
  if (userSkills.length > 0) {
    throw new Error(`Cannot delete skill "${record.name}" because it is being used by one or more users. Remove all user skills associated with this skill before deleting it.`);
  }

  // Proceed with deletion if no references exist
  await deleteRecord(record);
};

export const options: ActionOptions = {
  actionType: "delete",
};