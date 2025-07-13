import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Settings, Plus, X, Check, Brain, Target, Globe, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { UserTopicProfile } from "@shared/schema";

interface TopicPreferencesProps {
  isOnboarding?: boolean;
  onComplete?: () => void;
}

const PREDEFINED_INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "Retail", "Entertainment", "Education",
  "Fashion", "Food & Beverage", "Travel", "Automotive", "Real Estate", "Sports"
];

const PREDEFINED_INTERESTS = [
  "AI & Machine Learning", "Sustainability", "Consumer Behavior", "Social Media Trends",
  "Brand Strategy", "Digital Marketing", "Innovation", "Cultural Shifts", "Gen Z",
  "Millennials", "Remote Work", "E-commerce", "Cryptocurrency", "Mental Health"
];

const GEOGRAPHIC_REGIONS = [
  "Global", "North America", "Europe", "Asia-Pacific", "Latin America", 
  "Middle East", "Africa", "United States", "United Kingdom", "Canada"
];

export function TopicPreferences({ isOnboarding = false, onComplete }: TopicPreferencesProps) {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState("");
  const [excludedTopics, setExcludedTopics] = useState("");
  const [preferredSources, setPreferredSources] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing profile
  const { data: profileData, isLoading } = useQuery<UserTopicProfile | null>({
    queryKey: ["/api/user/topic-profile"],
    queryFn: async () => {
      const response = await fetch("/api/user/topic-profile", {
        credentials: "include"
      });
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No profile exists yet
        }
        throw new Error("Failed to fetch topic profile");
      }
      return response.json();
    },
  });

  const profile = profileData;

  // Populate form with existing data
  useEffect(() => {
    if (profile) {
      setSelectedIndustries(profile.industries || []);
      setSelectedInterests(profile.interests || []);
      setSelectedRegions(profile.geographicFocus || []);
      setCustomKeywords(profile.keywords?.join(", ") || "");
      setExcludedTopics(profile.excludedTopics?.join(", ") || "");
      setPreferredSources(profile.preferredSources || []);
    }
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: async (profileData: Partial<UserTopicProfile>) => {
      const method = profile ? "PUT" : "POST";
      return apiRequest(`/api/user/topic-profile`, {
        method,
        body: JSON.stringify(profileData)
      });
    },
    onSuccess: () => {
      toast({
        title: "Preferences saved",
        description: "Your topic preferences have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/topic-profile"] });
      if (onComplete) onComplete();
    },
    onError: (error: any) => {
      toast({
        title: "Error saving preferences",
        description: error.message || "Failed to save topic preferences",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const profileData = {
      industries: selectedIndustries,
      interests: selectedInterests,
      keywords: customKeywords.split(",").map(k => k.trim()).filter(k => k),
      geographicFocus: selectedRegions,
      excludedTopics: excludedTopics.split(",").map(t => t.trim()).filter(t => t),
      preferredSources: preferredSources,
    };

    saveProfileMutation.mutate(profileData);
  };

  const toggleSelection = (item: string, selectedItems: string[], setSelectedItems: (items: string[]) => void) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter(i => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const addCustomSource = () => {
    const input = document.getElementById("custom-source-input") as HTMLInputElement;
    if (input && input.value.trim()) {
      setPreferredSources([...preferredSources, input.value.trim()]);
      input.value = "";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          {isOnboarding ? "Set Up Your Intelligence Preferences" : "Topic Preferences"}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Customize your feed to show the most relevant content for your strategic work.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Industries */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Industries of Interest
          </Label>
          <p className="text-xs text-gray-500 mb-3">Select the industries you focus on</p>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_INDUSTRIES.map((industry) => (
              <Badge
                key={industry}
                variant={selectedIndustries.includes(industry) ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => toggleSelection(industry, selectedIndustries, setSelectedIndustries)}
              >
                {industry}
                {selectedIndustries.includes(industry) && <Check className="h-3 w-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Interests */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Strategic Interests
          </Label>
          <p className="text-xs text-gray-500 mb-3">Areas you want to track for strategic opportunities</p>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_INTERESTS.map((interest) => (
              <Badge
                key={interest}
                variant={selectedInterests.includes(interest) ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => toggleSelection(interest, selectedInterests, setSelectedInterests)}
              >
                {interest}
                {selectedInterests.includes(interest) && <Check className="h-3 w-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Geographic Focus */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geographic Focus
          </Label>
          <p className="text-xs text-gray-500 mb-3">Select regions for market intelligence</p>
          <div className="flex flex-wrap gap-2">
            {GEOGRAPHIC_REGIONS.map((region) => (
              <Badge
                key={region}
                variant={selectedRegions.includes(region) ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => toggleSelection(region, selectedRegions, setSelectedRegions)}
              >
                {region}
                {selectedRegions.includes(region) && <Check className="h-3 w-3 ml-1" />}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Custom Keywords */}
        <div>
          <Label htmlFor="custom-keywords" className="text-sm font-medium">
            Custom Keywords
          </Label>
          <p className="text-xs text-gray-500 mb-3">Comma-separated keywords to track</p>
          <Textarea
            id="custom-keywords"
            placeholder="e.g., quiet luxury, attention economy, cultural moments"
            value={customKeywords}
            onChange={(e) => setCustomKeywords(e.target.value)}
            className="resize-none h-20"
          />
        </div>

        {/* Excluded Topics */}
        <div>
          <Label htmlFor="excluded-topics" className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Excluded Topics
          </Label>
          <p className="text-xs text-gray-500 mb-3">Topics to filter out (noise reduction)</p>
          <Textarea
            id="excluded-topics"
            placeholder="e.g., politics, sports, celebrity gossip"
            value={excludedTopics}
            onChange={(e) => setExcludedTopics(e.target.value)}
            className="resize-none h-16"
          />
        </div>

        {/* Preferred Sources */}
        <div>
          <Label className="text-sm font-medium">Preferred Sources</Label>
          <p className="text-xs text-gray-500 mb-3">Add platforms or domains you trust</p>
          <div className="flex gap-2 mb-3">
            <Input
              id="custom-source-input"
              placeholder="e.g., Reddit, TikTok, Wired, FastCompany"
              onKeyDown={(e) => e.key === 'Enter' && addCustomSource()}
            />
            <Button onClick={addCustomSource} size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferredSources.map((source, index) => (
              <Badge key={index} variant="secondary" className="cursor-pointer">
                {source}
                <X
                  className="h-3 w-3 ml-1"
                  onClick={() => setPreferredSources(preferredSources.filter((_, i) => i !== index))}
                />
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={saveProfileMutation.isPending}
            className="min-w-32"
          >
            {saveProfileMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}