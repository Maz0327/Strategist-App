import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Database, 
  Target, 
  MapPin, 
  Brain, 
  Tag, 
  Smartphone, 
  Sparkles,
  Plus,
  Download,
  Info
} from "lucide-react";

interface Cohort {
  id: string;
  name: string;
  description: string;
  pillar: string;
  characteristics: string[];
  size: string;
  behavior: string;
  platforms: string[];
  opportunity: string;
}

export function CohortBuilder() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [currentCohort, setCurrentCohort] = useState<Partial<Cohort>>({
    pillar: '1p-data'
  });
  const { toast } = useToast();

  const sevenPillars = [
    {
      id: '1p-data',
      name: 'Raw Behavior',
      icon: Database,
      description: 'Data directly tied to your audience\'s real-world actions, purchases, interactions, and digital engagement patterns',
      examples: ['Previous buyers of X', 'High-value customers', 'Repeat purchasers']
    },
    {
      id: 'competitive',
      name: 'Rival Landscape',
      icon: Target,
      description: 'Analysis of competitors\' content, tone, positioning, and market gaps for strategic differentiation',
      examples: ['Brand Y loyalists', 'Competitor switchers', 'Price-sensitive shoppers']
    },
    {
      id: 'regional',
      name: 'Local Pulse',
      icon: MapPin,
      description: 'Localized trends and cultural conversations emerging from specific geographies or communities',
      examples: ['Texas millennials', 'Urban northeast', 'Emerging markets']
    },
    {
      id: 'lifestage',
      name: 'Life Lens',
      icon: Brain,
      description: 'Audience psychology and mindset shaped by their life stage, values, and aspirations',
      examples: ['New parents', 'Career climbers', 'Health-conscious adults']
    },
    {
      id: 'category',
      name: 'Market Moves',
      icon: Tag,
      description: 'Industry norms and consumer behavior patterns specific to your product category & vertical',
      examples: ['Fitness enthusiasts', 'Eco-conscious consumers', 'Tech early adopters']
    },
    {
      id: 'platforms',
      name: 'Channel Vibes',
      icon: Smartphone,
      description: 'Platform-specific behavior, language, format norms, and native communication styles',
      examples: ['TikTok creators', 'LinkedIn professionals', 'YouTube learners']
    },
    {
      id: 'wildcard',
      name: 'Surprise Signals',
      icon: Sparkles,
      description: 'Emerging, fringe, or unpredictable content and subculture signals not fitting conventional categories. A lot of good concepts come from here',
      examples: ['Meme culture participants', 'Viral trend followers', 'Cultural rebels']
    }
  ];

  const handleAddCohort = () => {
    if (!currentCohort.name || !currentCohort.description) {
      toast({
        title: "Incomplete Cohort",
        description: "Please provide a name and description for the cohort",
        variant: "destructive",
      });
      return;
    }

    const newCohort: Cohort = {
      id: Date.now().toString(),
      name: currentCohort.name!,
      description: currentCohort.description!,
      pillar: currentCohort.pillar!,
      characteristics: currentCohort.characteristics || [],
      size: currentCohort.size || 'Unknown',
      behavior: currentCohort.behavior || '',
      platforms: currentCohort.platforms || [],
      opportunity: currentCohort.opportunity || ''
    };

    setCohorts(prev => [newCohort, ...prev]);
    setCurrentCohort({ pillar: '1p-data' });
    
    toast({
      title: "Cohort Added",
      description: `${newCohort.name} has been added to your cohort library`,
    });
  };

  const handleExportCohorts = () => {
    const content = `# Cohort Analysis Report
*Generated ${new Date().toLocaleDateString()}*

## Cohort Framework: Seven Pillars Methodology

This analysis identifies ${cohorts.length} strategic audience cohorts across the seven pillars framework for maximum marketing relevance and effectiveness.

${cohorts.map(cohort => {
  const pillar = sevenPillars.find(p => p.id === cohort.pillar);
  return `
## ${cohort.name}
**Pillar:** ${pillar?.name || 'Unknown'}
**Description:** ${cohort.description}

**Key Characteristics:**
${cohort.characteristics.map(c => `- ${c}`).join('\n')}

**Behavioral Patterns:** ${cohort.behavior || 'Not specified'}
**Estimated Size:** ${cohort.size}
**Primary Platforms:** ${cohort.platforms.join(', ') || 'Not specified'}
**Strategic Opportunity:** ${cohort.opportunity || 'Not specified'}

---`;
}).join('\n')}

## Strategic Recommendations

1. **High-Priority Cohorts:** Focus on cohorts with clear behavioral patterns and platform presence
2. **Content Strategy:** Create contextual content for each cohort's preferred platforms
3. **Testing Strategy:** Start with smallest, most defined cohorts for rapid iteration
4. **Measurement:** Track engagement and conversion by cohort for optimization

## Implementation Notes

- Cohorts should be named like "long-tail search queries" for specificity
- Regular validation through social listening and engagement metrics
- Cross-cohort opportunities for scaling successful approaches

---
*Generated using the Seven Pillars Cohort Framework*`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cohort-analysis-report.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Cohorts Exported",
      description: "Your cohort analysis has been downloaded",
    });
  };

  const currentPillar = sevenPillars.find(p => p.id === currentCohort.pillar);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Cohort Builder - Seven Pillars Framework
          </CardTitle>
          <p className="text-sm text-gray-600">
            Build strategic audience cohorts using the proven seven pillars methodology
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="builder">Build Cohorts</TabsTrigger>
          <TabsTrigger value="library">Cohort Library ({cohorts.length})</TabsTrigger>
          <TabsTrigger value="framework">Framework Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Cohort</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pillar Selection */}
              <div>
                <Label>Select Pillar</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                  {sevenPillars.map((pillar) => {
                    const Icon = pillar.icon;
                    return (
                      <Button
                        key={pillar.id}
                        variant={currentCohort.pillar === pillar.id ? "default" : "outline"}
                        className="h-auto p-4 flex flex-col items-center gap-2"
                        onClick={() => setCurrentCohort(prev => ({ ...prev, pillar: pillar.id }))}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs text-center">{pillar.name}</span>
                      </Button>
                    );
                  })}
                </div>
                {currentPillar && (
                  <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-900">{currentPillar.name}</h4>
                    <p className="text-sm text-blue-700 mt-1">{currentPillar.description}</p>
                    <div className="mt-2">
                      <p className="text-xs text-blue-600">Examples:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {currentPillar.examples.map((example, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cohort Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cohort-name">Cohort Name</Label>
                  <Input
                    id="cohort-name"
                    placeholder="e.g., Fitness-focused millennial professionals"
                    value={currentCohort.name || ''}
                    onChange={(e) => setCurrentCohort(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500 mt-1">Name like a "long-tail search query"</p>
                </div>
                <div>
                  <Label htmlFor="cohort-size">Estimated Size</Label>
                  <Input
                    id="cohort-size"
                    placeholder="e.g., 2.3M users, 15% of audience"
                    value={currentCohort.size || ''}
                    onChange={(e) => setCurrentCohort(prev => ({ ...prev, size: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="cohort-description">Description</Label>
                <Textarea
                  id="cohort-description"
                  placeholder="Detailed description of this cohort, their characteristics, and why they're relevant..."
                  value={currentCohort.description || ''}
                  onChange={(e) => setCurrentCohort(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="cohort-behavior">Key Behaviors</Label>
                <Textarea
                  id="cohort-behavior"
                  placeholder="What behavioral patterns define this cohort? How do they interact with content?"
                  value={currentCohort.behavior || ''}
                  onChange={(e) => setCurrentCohort(prev => ({ ...prev, behavior: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="cohort-opportunity">Strategic Opportunity</Label>
                <Textarea
                  id="cohort-opportunity"
                  placeholder="What's the marketing opportunity with this cohort? What makes them valuable?"
                  value={currentCohort.opportunity || ''}
                  onChange={(e) => setCurrentCohort(prev => ({ ...prev, opportunity: e.target.value }))}
                  rows={2}
                />
              </div>

              <Button onClick={handleAddCohort} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Cohort to Library
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Cohort Library</h3>
            {cohorts.length > 0 && (
              <Button onClick={handleExportCohorts} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Analysis
              </Button>
            )}
          </div>

          {cohorts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No cohorts yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start building strategic audience cohorts using the framework
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cohorts.map((cohort) => {
                const pillar = sevenPillars.find(p => p.id === cohort.pillar);
                const Icon = pillar?.icon || Users;
                
                return (
                  <Card key={cohort.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-blue-600" />
                        <Badge variant="secondary" className="text-xs">
                          {pillar?.name || 'Unknown'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{cohort.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-700">{cohort.description}</p>
                      
                      {cohort.size && (
                        <div className="text-xs text-gray-600">
                          <strong>Size:</strong> {cohort.size}
                        </div>
                      )}
                      
                      {cohort.behavior && (
                        <div className="text-xs text-gray-600">
                          <strong>Behavior:</strong> {cohort.behavior}
                        </div>
                      )}
                      
                      {cohort.opportunity && (
                        <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                          <strong>Opportunity:</strong> {cohort.opportunity}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="framework" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seven Pillars Framework Guide</CardTitle>
              <p className="text-sm text-gray-600">
                A comprehensive approach to audience segmentation for maximum marketing relevance
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sevenPillars.map((pillar) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={pillar.id} className="border-l-4 border-blue-200 pl-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold text-blue-900">{pillar.name}</h4>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{pillar.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {pillar.examples.map((example, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p><strong>Naming Convention:</strong> Use "long-tail search query" style names for specificity</p>
                <p><strong>Size Matters:</strong> Start with smaller, well-defined cohorts for testing</p>
                <p><strong>Behavioral Focus:</strong> Prioritize behavior patterns over demographics</p>
                <p><strong>Platform Context:</strong> Consider where each cohort spends their attention</p>
                <p><strong>Validation:</strong> Use social listening and engagement data to validate cohorts</p>
                <p><strong>Iteration:</strong> Regularly update cohorts based on performance data</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}