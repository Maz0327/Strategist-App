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
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Dashboard Overview</h3>
                  <p className="text-sm text-green-800">
                    Monitor your signals, track performance, and manage your strategic content analysis.
                  </p>
                </div>
                <SignalsDashboard />
              </div>
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
                Daily Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Daily Reports</h3>
                  <p className="text-sm text-purple-800">
                    Generate and review daily strategic reports based on your captured signals.
                  </p>
                </div>
                <DailyReport />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Audience Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">Audience Insights</h3>
                  <p className="text-sm text-orange-800">
                    Build cohorts and analyze audience behavior patterns for strategic targeting.
                  </p>
                </div>
                <CohortBuilder />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}