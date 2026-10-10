import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat Management Panel',
  description: 'Admin dashboard for managing chat conversations and support operations',
};

export default function ChatAdminPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-3xl font-bold mb-6">Chat Management Panel</h1>
      <div className="grid gap-6">
        <div className="bg-card text-card-foreground rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Welcome to Chat Management</h2>
          <p className="text-muted-foreground">
            This is the admin panel for managing chat conversations, support operations,
            and monitoring AI insights. Use the navigation to access different sections.
          </p>
        </div>

        <div className="bg-card text-card-foreground rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span>Active Sessions:</span>
              <span className="font-medium">124</span>
            </div>
            <div className="flex justify-between">
              <span>Waiting in Queue:</span>
              <span className="font-medium">5</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Response Time:</span>
              <span className="font-medium">3.2 min</span>
            </div>
            <div className="flex justify-between">
              <span>Satisfaction Score:</span>
              <span className="font-medium">4.8/5</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
