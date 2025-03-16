import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "request" model, go to https://skillissuesz.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "P1Bxh_2DzKO3",
  comment:
    "This model represents a request between two users, capturing the sender, receiver, status, and type of request.",
  fields: {
    receiver: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "5Ms_R7iepGgp",
    },
    sender: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "8vQMhhCCRTRt",
    },
    status: {
      type: "enum",
      default: "pending",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["pending", "accepted", "rejected"],
      validations: { required: true },
      storageKey: "N_WgcqUjz_N_",
    },
  },
};
