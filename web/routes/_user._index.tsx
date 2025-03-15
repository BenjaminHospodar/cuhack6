import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AutoTable } from "@/components/auto";
import { Pencil, PlusCircle, Search, AlertCircle, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useOutletContext } from "react-router";
import type { AuthOutletContext } from "./_user";
import { api } from "../api";
import { useState } from "react";
import { Link } from "react-router";
import { useFindMany } from "@gadgetinc/react";
import { Select } from "@/components/ui/select";

export default function () {
  const { gadgetConfig, user } = useOutletContext<AuthOutletContext>();
  const [selectedSkill, setSelectedSkill] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  
  // Fetch user's skills
  const [{ data: userSkills, fetching: fetchingUserSkills }] = useFindMany(
    api.userSkill,
    {
      filter: { userId: { equals: user.id } },
      select: {
        id: true,
        proficiencyLevel: true,
        skill: { id: true, name: true, description: true }
      }
    }
  );
  
  const hasNoSkills = !fetchingUserSkills && (!userSkills || userSkills.length === 0);
  
  // Fetch all skills for the skill selector
  const [{ data: allSkills, fetching: fetchingAllSkills }] = useFindMany(
    api.skill,
    {
      select: { id: true, name: true }
    }
  );
  
  // Fetch users with selected skill
  const [{ data: usersWithSkill, fetching: fetchingUsersWithSkill }] = useFindMany(
    api.user,
    {
      filter: selectedSkill ? {
        skills: {
          some: { id: { equals: selectedSkill } }
        }
      } : undefined,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        skills: {
          edges: {
            node: {
              id: true,
              name: true
            }
          }
        },
        userSkills: {
          edges: {
            node: {
              id: true,
              proficiencyLevel: true,
              skill: { id: true, name: true }
            }
          }
        }
      }
    }
  );
  
  // Fetch users by name search
  const [{ data: usersByName, fetching: fetchingUsersByName }] = useFindMany(
    api.user,
    {
      filter: nameQuery ? {
        OR: [
          { firstName: { startsWith: nameQuery } },
          { lastName: { startsWith: nameQuery } }
        ]
      } : undefined,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userSkills: {
          edges: {
            node: {
              id: true,
              proficiencyLevel: true,
              skill: { id: true, name: true }
            }
          }
        }
      }
    }
  );

  const handleSkillChange = (e) => {
    setSelectedSkill(e.target.value);
  };
  
  const handleNameChange = (e) => {
    setNameQuery(e.target.value);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="grid gap-6">
        {/* Welcome banner for new users */}
        {hasNoSkills && (
          <Card className="p-4 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <div className="flex items-start space-x-4">
              <div className="text-blue-700 dark:text-blue-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-300">Welcome to Skill Issues!</h2>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  It looks like you haven't added any skills to your profile yet. Complete your profile to connect with others who share your skills.
                </p>
                <Button asChild size="sm" className="mt-2">
                  <Link to="/profile">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Complete Your Profile
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Compact user info card */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">User Profile</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open(
                    "/edit/files/web/routes/_user.signed-in.tsx",
                    "_blank"
                  );
                }}
              >
                <Pencil className="mr-2 h-3 w-3" />
                Edit page
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Name:</span>{" "}
                {`${user.firstName || ""} ${user.lastName || ""}`}
              </div>
              <div className="text-sm">
                <span className="font-medium text-muted-foreground">Email:</span>{" "}
                <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                  {user.email}
                </a>
              </div>
            </div>
          </div>
        </Card>

        {/* User's Skills section */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your Skills</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  These are the skills you've added to your profile.
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link to="/profile">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Manage Skills
                </Link>
              </Button>
            </div>
            
            {fetchingUserSkills ? (
              <div className="text-center py-4">Loading your skills...</div>
            ) : userSkills && userSkills.length > 0 ? (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Skill</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                      <th className="p-3 text-left text-sm font-medium text-muted-foreground">Proficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSkills.map((userSkill) => (
                      <tr key={userSkill.id} className="border-b">
                        <td className="p-3 text.sm">{userSkill.skill.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{userSkill.skill.description}</td>
                        <td className="p-3 text-sm">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            userSkill.proficiencyLevel === "Expert" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              : userSkill.proficiencyLevel === "Intermediate"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                          }`}>
                            {userSkill.proficiencyLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mb-2">You haven't added any skills to your profile yet.</div>
                <Button asChild size="sm">
                  <Link to="/profile">Add Skills</Link>
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Search for users by skills or name */}
        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Find Users</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Search for users by their skills or names.
              </p>
            </div>
            
            <Tabs defaultValue="skill" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="skill">
                  <Search className="mr-2 h-4 w-4" />
                  Search by Skill
                </TabsTrigger>
                <TabsTrigger value="name">
                  <User className="mr-2 h-4 w-4" />
                  Search by Name
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="skill">
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex-1">
                    <select 
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      value={selectedSkill}
                      onChange={handleSkillChange}
                    >
                      <option value="">Select a skill</option>
                      {allSkills?.map(skill => (
                        <option key={skill.id} value={skill.id}>{skill.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {selectedSkill && (
                  <div className="space-y-2 mt-4">
                    <h3 className="text-lg font-medium">Users with selected skill</h3>
                    {fetchingUsersWithSkill ? (
                      <div className="text-center py-4">Searching for users...</div>
                    ) : usersWithSkill && usersWithSkill.length > 0 ? (
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Proficiency</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersWithSkill.map((matchedUser) => {
                              const userSkill = matchedUser.userSkills?.edges.find(
                                edge => edge.node.skill.id === selectedSkill
                              )?.node;
                              
                              return (
                                <tr key={matchedUser.id} className="border-b">
                                  <td className="p-3 text-sm">
                                    {`${matchedUser.firstName || ""} ${matchedUser.lastName || ""}`.trim() || "N/A"}
                                  </td>
                                  <td className="p-3 text-sm">
                                    <a href={`mailto:${matchedUser.email}`} className="text-primary hover:underline">
                                      {matchedUser.email}
                                    </a>
                                  </td>
                                  <td className="p-3 text-sm">
                                    {userSkill && (
                                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        userSkill.proficiencyLevel === "Expert" 
                                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                          : userSkill.proficiencyLevel === "Intermediate"
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                      }`}>
                                        {userSkill.proficiencyLevel}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No users found with this skill.
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="name">
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Search by name..."
                      value={nameQuery}
                      onChange={handleNameChange}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {nameQuery && (
                  <div className="space-y-2 mt-4">
                    <h3 className="text-lg font-medium">Users matching "{nameQuery}"</h3>
                    {fetchingUsersByName ? (
                      <div className="text-center py-4">Searching for users...</div>
                    ) : usersByName && usersByName.length > 0 ? (
                      <div className="rounded-md border">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b bg-muted/50">
                              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                              <th className="p-3 text-left text-sm font-medium text-muted-foreground">Skills</th>
                            </tr>
                          </thead>
                          <tbody>
                            {usersByName.map((matchedUser) => {
                              return (
                                <tr key={matchedUser.id} className="border-b">
                                  <td className="p-3 text-sm">
                                    {`${matchedUser.firstName || ""} ${matchedUser.lastName || ""}`.trim() || "N/A"}
                                  </td>
                                  <td className="p-3 text-sm">
                                    <a href={`mailto:${matchedUser.email}`} className="text-primary hover:underline">
                                      {matchedUser.email}
                                    </a>
                                  </td>
                                  <td className="p-3 text-sm">
                                    <div className="flex flex-wrap gap-1">
                                      {matchedUser.userSkills?.edges.length > 0 ? 
                                        matchedUser.userSkills.edges.map(edge => (
                                          <span 
                                            key={edge.node.id} 
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                              edge.node.proficiencyLevel === "Expert" 
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                                : edge.node.proficiencyLevel === "Intermediate"
                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                            }`}
                                          >
                                            {edge.node.skill.name} ({edge.node.proficiencyLevel})
                                          </span>
                                        ))
                                        : <span className="text-muted-foreground">No skills</span>
                                      }
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No users found matching "{nameQuery}".
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}
