import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "user" model, go to https://skillissuesz.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "aQw-KSYE2sHt",
  fields: {
    email: {
      type: "email",
      validations: { required: true, unique: true },
      storageKey: "q171GUKOo4LK",
    },
    emailVerificationToken: {
      type: "string",
      storageKey: "9QqeOGjbdN9a",
    },
    emailVerificationTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "T4uHu0JYwpKl",
    },
    emailVerified: {
      type: "boolean",
      default: false,
      storageKey: "vQsSNnm3gs2A",
    },
    firstName: { type: "string", storageKey: "tJsd3jKgNH8C" },
    googleImageUrl: { type: "url", storageKey: "hgkUkhmI1cOO" },
    googleProfileId: { type: "string", storageKey: "U-VS-iVQXqfu" },
    lastName: { type: "string", storageKey: "Q5z9GfRLB_CK" },
    lastSignedIn: {
      type: "dateTime",
      includeTime: true,
      storageKey: "iPbbGajlg_EH",
    },
    password: {
      type: "password",
      validations: { strongPassword: true },
      storageKey: "T2S_HNSAiFoL",
    },
    resetPasswordToken: {
      type: "string",
      storageKey: "RDgcn1uBfOZX",
    },
    resetPasswordTokenExpiration: {
      type: "dateTime",
      includeTime: true,
      storageKey: "ZU-hvZbG30w2",
    },
    roles: {
      type: "roleList",
      default: ["unauthenticated"],
      storageKey: "wddwNCLG-E5N",
    },
    skillInterests: {
      type: "hasManyThrough",
      sibling: { model: "skill", relatedField: null },
      join: {
        model: "userSkillInterest",
        belongsToSelfField: "user",
        belongsToSiblingField: "skill",
      },
      storageKey: "gklL3C9kbWj4",
    },
    skills: {
      type: "hasManyThrough",
      sibling: { model: "skill", relatedField: "users" },
      join: {
        model: "userSkill",
        belongsToSelfField: "user",
        belongsToSiblingField: "skill",
      },
      storageKey: "2lKk-ghQPkFN",
    },
  },
};
