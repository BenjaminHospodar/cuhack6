import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "userRating" model, go to https://skillissuesz.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "p7PEVSGy7VGW",
  comment:
    "This model stores user ratings, where one user can rate another user with a score from 1 to 5 and provide optional feedback.",
  fields: {
    rated: {
      type: "belongsTo",
      validations: {
        required: true,
        unique: { scopeByField: "rater" },
      },
      parent: { model: "user" },
      storageKey: "Ym75j9fFOuQL",
    },
    rater: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "_zy7aCp2diQY",
    },
    rating: {
      type: "number",
      decimals: 0,
      validations: {
        required: true,
        numberRange: { min: 1, max: 5 },
      },
      storageKey: "k-2YIuu7zpgu",
    },
  },
};
