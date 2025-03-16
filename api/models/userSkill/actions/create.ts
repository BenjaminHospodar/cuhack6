import { applyParams, save, ActionOptions } from "gadget-server";
import { preventCrossUserDataAccess } from "gadget-server/auth";

export const run: ActionRun = async ({ params, record, logger, api, connections }) => {
  // Get the user ID and skill ID from params
  const userId = params.userSkill?.user?._link;
  const skillId = params.userSkill?.skill?._link;

  // Check if a userSkill already exists with this user-skill combination
  if (userId && skillId) {
    const existingUserSkill = await api.userSkill.maybeFindFirst({
      filter: {
        userId: { equals: userId },
        skillId: { equals: skillId }
      }
    });

    if (existingUserSkill) {
      throw new Error("You already have this skill in your profile.");
    }
  }

  applyParams(params, record);
  await preventCrossUserDataAccess(params, record);
  await save(record);
};

export const options: ActionOptions = {
  actionType: "create",
};