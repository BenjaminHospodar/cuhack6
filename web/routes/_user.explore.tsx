import { useFindMany } from "@gadgetinc/react";
import { useState, useDeferredValue } from "react";
import { api } from "../api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function ExplorePage() {
  const [nameSearch, setNameSearch] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  
  const deferredNameSearch = useDeferredValue(nameSearch);
  const deferredSkillSearch = useDeferredValue(skillSearch);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Explore</h1>
      
      <Tabs defaultValue="name" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="name">Search by Name</TabsTrigger>
          <TabsTrigger value="skill">Search by Skill</TabsTrigger>
        </TabsList>
        
        <TabsContent value="name">
          <div className="mb-6">
            <Input
              placeholder="Search users by name..."
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              className="max-w-lg"
            />
          </div>
          <NameSearchResults searchTerm={deferredNameSearch} />
        </TabsContent>
        
        <TabsContent value="skill">
          <div className="mb-6">
            <Input
              placeholder="Search users by skill..."
              value={skillSearch}
              onChange={(e) => setSkillSearch(e.target.value)}
              className="max-w-lg"
            />
          </div>
          <SkillSearchResults searchTerm={deferredSkillSearch} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NameSearchResults({ searchTerm }: { searchTerm: string }) {
  const [{ data: users, fetching, error }] = useFindMany(api.user, {
    filter: searchTerm ? {
      OR: [
        { firstName: { contains: searchTerm } },
        { lastName: { contains: searchTerm } }
      ]
    } : undefined,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      googleImageUrl: true,
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
            proficiencyLevel: true,
            skill: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  if (fetching) {
    return <div>Loading users...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!users?.length) {
    return <div>No users found matching "{searchTerm}"</div>;
  }

  return <UserResults users={users} />;
}

function SkillSearchResults({ searchTerm }: { searchTerm: string }) {
  // First, find skills matching the search term
  const [{ data: skills, fetching: fetchingSkills, error: skillsError }] = useFindMany(
    api.skill,
    {
      filter: searchTerm ? { name: { contains: searchTerm } } : undefined,
    }
  );

  // Get all user IDs who have matching skills
  const skillIds = skills?.map(skill => skill.id) || [];
  
  const [{ data: users, fetching: fetchingUsers, error: usersError }] = useFindMany(
    api.user,
    {
      filter: skillIds.length ? {
        skills: {
          some: {
            id: {
              in: skillIds
            }
          }
        }
      } : undefined,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        googleImageUrl: true,
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
              proficiencyLevel: true,
              skill: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    }
  );

  if (fetchingSkills || fetchingUsers) {
    return <div>Loading users with matching skills...</div>;
  }

  if (skillsError) {
    return <div>Error loading skills: {skillsError.message}</div>;
  }

  if (usersError) {
    return <div>Error loading users: {usersError.message}</div>;
  }

  if (!searchTerm) {
    return <div>Enter a skill to search for users</div>;
  }

  if (!users?.length) {
    return <div>No users found with skills matching "{searchTerm}"</div>;
  }

  return <UserResults users={users} />;
}

function UserResults({ users }: { users: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <Card key={user.id}>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar>
              <AvatarImage src={user.googleImageUrl || undefined} />
              <AvatarFallback>
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.firstName} {user.lastName}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <h4 className="font-semibold mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {user.userSkills.edges.map(({ node }: any) => (
                <Badge key={node.skill.id} variant="secondary" className="flex items-center gap-1">
                  {node.skill.name}
                  <span className="text-xs opacity-75">({node.proficiencyLevel})</span>
                </Badge>
              ))}
            </div>
          </CardContent>
          <Separator />
          <CardFooter className="pt-4">
            <div className="text-sm text-muted-foreground">User ID: {user.id}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}