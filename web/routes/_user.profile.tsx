import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAction, useActionForm, useFindMany } from "@gadgetinc/react";
import { useState, useEffect } from "react";
import { api } from "../api";
import { toast } from "sonner";
import { useOutletContext } from "react-router";
import type { AuthOutletContext } from "./_user";

export default function () {
  const { user } = useOutletContext<AuthOutletContext>();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isAddingNewSkill, setIsAddingNewSkill] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [proficiencyLevel, setProficiencyLevel] = useState<string>("Beginner");

  const [{ data: userSkills, fetching: fetchingUserSkills }] = useFindMany(
    api.userSkill,
    {
      filter: { userId: { equals: user.id } },
      select: {
        id: true,
        proficiencyLevel: true,
        skill: {
          id: true,
          name: true,
          description: true,
        },
      },
    }
  );

  const [{ data: allSkills, fetching: fetchingSkills }] = useFindMany(
    api.skill,
    {
      select: {
        id: true,
        name: true,
        description: true,
      },
    }
  );

  const [{ fetching: isDeleting }, deleteUserSkill] = useAction(
    api.userSkill.delete
  );

  const [{ fetching: isCreating }, createUserSkill] = useAction(
    api.userSkill.create
  );
  
  const [{ fetching: isCreatingSkill }, createSkill] = useAction(
    api.skill.create
  );

  const hasName = user.firstName || user.lastName;
  const title = hasName ? `${user.firstName} ${user.lastName}` : user.email;
  const initials = hasName
    ? (user.firstName?.slice(0, 1) ?? "") + (user.lastName?.slice(0, 1) ?? "")
    : "";

  // Filter out skills the user already has
  const availableSkills = allSkills?.filter(
    (skill) =>
      !userSkills?.some((userSkill) => userSkill.skill.id === skill.id)
  );

  const handleAddSkill = async () => {
    if (selectedSkill) {
      await createUserSkill({
        proficiencyLevel,
        skill: {
          _link: selectedSkill,
        },
        user: {
          _link: user.id,
        },
      });
      setSelectedSkill("");
      setProficiencyLevel("Beginner");
      toast.success("Skill added successfully!");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="rounded-lg shadow p-6 bg-background border mb-6">
        <div className="flex items-start justify-between">
          <div className="flex gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.profilePicture?.url} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              {hasName && <p className="text-gray-600">{user.email}</p>}
              {user.city && <p className="text-gray-600">{user.city}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            {!user.googleProfileId && (
              <Button
                variant="ghost"
                onClick={() => setIsChangingPassword(true)}
              >
                Change password
              </Button>
            )}
            <Button variant="ghost" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>My Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {fetchingUserSkills ? (
              <div className="py-4">Loading skills...</div>
            ) : userSkills?.length ? (
              <div className="space-y-3">
                {userSkills.map((userSkill) => (
                  <div
                    key={userSkill.id}
                    className="flex items-center justify-between p-3 rounded-md border"
                  >
                    <div>
                      <div className="font-medium">{userSkill.skill.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {userSkill.skill.description}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {userSkill.proficiencyLevel}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteUserSkill({ id: userSkill.id })}
                      disabled={isDeleting}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No skills added yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Skills</CardTitle>
          </CardHeader>
          <CardContent>
            {fetchingSkills ? (
              <div className="py-4">Loading available skills...</div>
            ) : availableSkills?.length ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill">Skill</Label>
                    <Select
                      value={selectedSkill}
                      onValueChange={setSelectedSkill}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a skill" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSkills.map((skill) => (
                          <SelectItem key={skill.id} value={skill.id}>
                            {skill.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proficiency">Proficiency Level</Label>
                    <Select
                      value={proficiencyLevel}
                      onValueChange={setProficiencyLevel}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleAddSkill}
                  disabled={!selectedSkill || isCreating}
                >
                  Add Skill
                </Button>
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddingNewSkill(true)}
                  >
                    Not seeing your skill? Add it
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <div>No more skills available to add</div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddingNewSkill(true)}
                  className="mt-4"
                >
                  Not seeing your skill? Add it
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <EditProfileModal open={isEditing} onClose={() => setIsEditing(false)} />
      <ChangePasswordModal
        open={isChangingPassword}
        onClose={() => setIsChangingPassword(false)}
      />
      <AddSkillModal
        open={isAddingNewSkill}
        onClose={() => setIsAddingNewSkill(false)}
        onSkillAdded={setSelectedSkill}
      />
    </div>
  );
}

const EditProfileModal = (props: { open: boolean; onClose: () => void }) => {
  const { user } = useOutletContext<AuthOutletContext>();
  const [{ fetching: isUpdating, error }, updateUser] = useAction(api.user.update);
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [city, setCity] = useState(user.city || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Using the correct format: nesting firstName and lastName under a user property
      await updateUser({
        id: user.id,
        user: {
          firstName,
          lastName,
          city
        }
      });
    
      toast.success("Profile updated successfully!");
      window.location.reload(); // Reload the page to refresh user data
      props.onClose();
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => {
      if (!open && !isSubmitting) props.onClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
            Failed to update profile: {error.toString()}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label>First Name</Label>
              <Input 
                placeholder="First name" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input 
                placeholder="Last name" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}  
              />
            </div>
            <div>
              <Label>City</Label>
              <Input 
                placeholder="City" 
                value={city}
                onChange={(e) => setCity(e.target.value)}  
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => !isSubmitting && props.onClose()} 
              type="button"
              disabled={isUpdating || isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUpdating || isSubmitting}
            >
              {isUpdating || isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AddSkillModal = (props: { 
  open: boolean; 
  onClose: () => void;
  onSkillAdded: (skillId: string) => void;
}) => {
  const { user } = useOutletContext<AuthOutletContext>();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [{ fetching: isCreatingSkill, error: skillError }, createSkill] = useAction(api.skill.create);
  const [{ fetching: isAddingSkill }, createUserSkill] = useAction(api.userSkill.create);
  
  // One simple loading state
  const isLoading = isCreatingSkill || isAddingSkill;

  // Reset form when opening
  useEffect(() => {
    if (props.open) {
      setName("");
      setDescription("");
    }
  }, [props.open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!name.trim()) return;
    
    try {
      // Create skill
      const result = await createSkill({
        name: name.trim(),
        description: description.trim(),
      });

      if (result?.skill?.id) {
        // Add to user
        await createUserSkill({
          proficiencyLevel: "Beginner",
          skill: { _link: result.skill.id },
          user: { _link: user.id },
        });

        toast.success("Skill added successfully!");
        props.onSkillAdded(result.skill.id);
        props.onClose();
      }
    } catch (error) {
      toast.error("Failed to add skill. Please try again.");
      console.error(error);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={(open) => {
      if (!open) props.onClose();
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Skill</DialogTitle>
        </DialogHeader>
        {skillError && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
            Error: {skillError.message || "Unknown error"}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="skillName">Skill Name</Label>
              <Input 
                id="skillName" 
                placeholder="e.g., JavaScript, Project Management" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="skillDescription">Description (optional)</Label>
              <Input 
                id="skillDescription" 
                placeholder="Brief description of this skill" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={props.onClose} 
              type="button"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? "Adding..." : "Add Skill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ChangePasswordModal = (props: { open: boolean; onClose: () => void }) => {
  const { user } = useOutletContext<AuthOutletContext>();
  const {
    register,
    submit,
    reset,
    formState: { errors, isSubmitting },
  } = useActionForm(api.user.changePassword, {
    defaultValues: user,
    onSuccess: props.onClose,
  });

  const onClose = () => {
    reset();
    props.onClose();
  };

  return (
    <Dialog open={props.open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                autoComplete="off"
                {...register("currentPassword")}
              />
              {errors?.root?.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.root.message}
                </p>
              )}
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                autoComplete="off"
                {...register("newPassword")}
              />
              {errors?.user?.password?.message && (
                <p className="text-red-500 text-sm mt-1">
                  New password {errors.user.password.message}
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
