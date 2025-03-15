import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "userSkill" model, go to https://skillissuesz.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "LNX5u3Ttco8Y",
  comment:
    "This model represents the association between a user and a skill, including the user's level of proficiency in that skill.",
  fields: {
    proficiencyLevel: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["Beginner", "Intermediate", "Expert"],
      validations: { required: true },
      storageKey: "egYD7HH4JDDq",
    },
    skill: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "skill" },
      storageKey: "lhPCk9sUDlaG",
    },
    user: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "user" },
      storageKey: "HK7qtl1T_nHb",
    },
  },
};
