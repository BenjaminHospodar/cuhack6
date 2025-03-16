import type { GadgetPermissions } from "gadget-server";

/**
 * This metadata describes the access control configuration available in your application.
 * Grants that are not defined here are set to false by default.
 *
 * View and edit your roles and permissions in the Gadget editor at https://skillissuesz.gadget.app/edit/settings/permissions
 */
export const permissions: GadgetPermissions = {
  type: "gadget/permissions/v1",
  roles: {
    "signed-in": {
      storageKey: "signed-in",
      default: {
        read: true,
        action: true,
      },
      models: {
        request: {
          read: {
            filter:
              "accessControl/filters/request/signed-in-read.gelly",
          },
          actions: {
            create: {
              filter:
                "accessControl/filters/request/signed-in-create.gelly",
            },
            delete: true,
            update: true,
          },
        },
        skill: {
          read: true,
          actions: {
            create: true,
            delete: true,
            update: true,
          },
        },
        user: {
          read: {
            filter: "accessControl/filters/user/tenant.gelly",
          },
          actions: {
            changePassword: {
              filter: "accessControl/filters/user/tenant.gelly",
            },
            signOut: {
              filter: "accessControl/filters/user/tenant.gelly",
            },
            update: {
              filter:
                "accessControl/filters/user/signed-in-update.gelly",
            },
          },
        },
        userSkill: {
          read: {
            filter:
              "accessControl/filters/userSkill/signed-in-read.gelly",
          },
          actions: {
            create: {
              filter:
                "accessControl/filters/userSkill/signed-in-read.gelly",
            },
            delete: {
              filter:
                "accessControl/filters/userSkill/signed-in-delete.gelly",
            },
            update: {
              filter:
                "accessControl/filters/userSkill/signed-in-read.gelly",
            },
          },
        },
      },
      actions: {
        extractSkills: true,
        recommendSkills: true,
      },
    },
    unauthenticated: {
      storageKey: "unauthenticated",
      models: {
        skill: {
          read: true,
        },
        user: {
          actions: {
            resetPassword: true,
            sendResetPassword: true,
            sendVerifyEmail: true,
            signIn: true,
            signUp: true,
            verifyEmail: true,
          },
        },
      },
    },
  },
};
