import { applyParams, save, ActionOptions } from "gadget-server";

// Powers form in web/routes/sign-in.tsx

export const run: ActionRun = async ({ params, record, logger, api, session, trigger }) => {
  logger.info({ userId: record.id, triggerType: trigger.type }, "User sign in process started");
  
  // Check if this is a Google OAuth sign in
  if (trigger.type === "google_oauth_signin") {
    logger.info({ userId: record.id }, "Processing Google OAuth sign in");
    
    // Check if the user already has firstName or lastName set with meaningful values
    const hasFirstName = record.firstName !== null && record.firstName !== undefined && record.firstName.trim() !== "";
    const hasLastName = record.lastName !== null && record.lastName !== undefined && record.lastName.trim() !== "";
    
    // Log the current name fields state
    logger.info({
      userId: record.id,
      hasFirstName,
      hasLastName,
      currentFirstName: record.firstName,
      currentLastName: record.lastName
    }, "Current user name fields state");
    
    if (hasFirstName || hasLastName) {
      // Create a copy of params to modify
      const modifiedParams = { ...params };
      
      // Remove firstName or lastName from params if the user already has them set
      if (hasFirstName) {
        logger.info({ userId: record.id }, "Preserving existing firstName value");
        delete modifiedParams.firstName;
      }
      
      if (hasLastName) {
        logger.info({ userId: record.id }, "Preserving existing lastName value");
        delete modifiedParams.lastName;
      }
      
      // Apply the modified params
      logger.info({ userId: record.id, paramKeys: Object.keys(modifiedParams) }, "Applying modified params");
      applyParams(modifiedParams, record);
    } else {
      // Apply all params if no name fields are set
      logger.info({ userId: record.id }, "No existing name fields found, applying all Google OAuth params");
      applyParams(params, record);
    }
  } else {
    // For non-Google sign-ins, apply all params as normal
    logger.info({ userId: record.id }, "Processing standard sign in");
    applyParams(params, record);
  }
  
  // Always update the lastSignedIn timestamp
  record.lastSignedIn = new Date();
  logger.info({ userId: record.id, lastSignedIn: record.lastSignedIn }, "Updating last signed in time");
  
  await save(record);
  logger.info({ userId: record.id }, "User record saved successfully");
  
  // Assigns the signed-in user to the active session
  session?.set("user", { _link: record.id });
  logger.info({ userId: record.id, sessionId: session?.id }, "User assigned to active session");
};


export const options: ActionOptions = {
  actionType: "update",
  triggers: {
    googleOAuthSignIn: true,
    emailSignIn: true,
  },
};
