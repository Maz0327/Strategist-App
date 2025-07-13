import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignalsDashboard } from "@/components/signals-dashboard";
import { SourcesManager } from "@/components/sources-manager";
import { DailyReport } from "@/components/daily-report";
import { CohortBuilder } from "@/components/cohort-builder";
import { BarChart3, Globe, Calendar, Users } from "lucide-react";

interface ManageHubProps {
  activeSubTab?: string;
}

export function ManageHub({ activeSubTab }: ManageHubProps) {
  const [activeTab, setActiveTab] = useState(activeSubTab || "dashboard");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Manage</h2>
        <p className="text-gray-600 mt-1">Organize your signals, sources, and strategic insights</p>
      </div>

      {/* Manage Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Sources</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Daily Reports</span>
          </TabsTrigger>
          <TabsTrigger value="cohorts" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Audience Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Signals Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SignalsDashboard />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Sources Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SourcesManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Intelligence Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DailyReport />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Audience Insight Generator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CohortBuilder />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}