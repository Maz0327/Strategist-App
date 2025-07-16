import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BriefBuilder } from "@/components/brief-builder";
import { GetToByBrief } from "@/components/get-to-by-brief";
import { Button } from "@/components/ui/button";
import { FileText, Target, Settings, ArrowRight } from "lucide-react";

interface StrategicBriefLabProps {
  activeSubTab?: string;
}

export function StrategicBriefLab({ activeSubTab }: StrategicBriefLabProps) {
  const [activeTab, setActiveTab] = useState(activeSubTab || "builder");
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Strategic Brief Lab</h2>
          <p className="text-gray-600 mt-1">Create strategic briefs from your validated signals</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Tools
        </Button>
      </div>

      {/* Brief Lab Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2" data-tutorial="brief-framework">
          <TabsTrigger value="builder" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Brief Builder</span>
          </TabsTrigger>
          <TabsTrigger value="framework" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Define → Shift → Deliver Framework</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Strategic Brief Builder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div data-tutorial="signal-selection">
                <BriefBuilder />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="framework" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Define → Shift → Deliver Strategic Framework
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GetToByBrief />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Advanced Tools (conditionally shown) */}
      {showAdvanced && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Advanced Brief Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Advanced tools like Audience Insight Generator will be available here</p>
              <Button variant="outline" disabled>
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}