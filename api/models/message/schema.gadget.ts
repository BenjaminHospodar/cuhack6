import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "message" model, go to https://skillissuesz.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "FThOAwWTJu-O",
  comment:
    "The message model stores messages exchanged between users, with fields for the message content, sender, receiver, and read status.",
  fields: {
    content: {
      type: "string",
      validations: { required: true },
      storageKey: "uPZYY2nj6JGm",
    },
    read: {
      type: "boolean",
      default: false,
      storageKey: "TtkiaTNk-QlK",
    },
    receiver: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "Emh7aSoSj_ON",
    },
    sender: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "3QDYjopqxeZ4",
    },
  },
};
