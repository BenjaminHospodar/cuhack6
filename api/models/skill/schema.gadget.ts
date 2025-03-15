import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "skill" model, go to https://skillissuesz.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "5owfVPSWzIdE",
  comment:
    "Represents a skill that a user can possess, with a unique name and optional description",
  fields: {
    description: { type: "string", storageKey: "U68otzh2SFSM" },
    name: {
      type: "string",
      validations: { required: true, unique: true },
      storageKey: "dtDfbLDAOLi-",
    },
    users: {
      type: "hasManyThrough",
      sibling: { model: "user", relatedField: "skills" },
      join: {
        model: "userSkill",
        belongsToSelfField: "skill",
        belongsToSiblingField: "user",
      },
      storageKey: "xbFooVVNNGEO",
    },
  },
};
