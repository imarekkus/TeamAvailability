import { Card, CardContent } from "@/components/ui/card";
import { UserWithAvailabilityCount } from "@shared/schema";

interface UserListProps {
  users: UserWithAvailabilityCount[];
}

export default function UserList({ users }: UserListProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Users</h2>
        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No users available</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">{user.username}</span>
                <span className="text-sm text-gray-500">
                  Available on {user.availabilityCount} {user.availabilityCount === 1 ? 'day' : 'days'}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
