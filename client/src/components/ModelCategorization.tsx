import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Tag, FolderOpen } from "lucide-react";
import type { Category, Tag as TagType, Model } from "@shared/schema";
import { useLanguage } from "@/lib/LanguageContext";

interface ModelCategorizationProps {
  model: Model;
  onUpdate?: () => void;
}

export function ModelCategorization({ model, onUpdate }: ModelCategorizationProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(model.categoryId);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [showAddTag, setShowAddTag] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Fetch tags for selected category
  const { data: availableTags = [] } = useQuery<TagType[]>({
    queryKey: ["/api/tags", selectedCategoryId],
    queryFn: async () => {
      const url = selectedCategoryId 
        ? `/api/tags?categoryId=${selectedCategoryId}` 
        : "/api/tags";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json();
    },
  });

  // Fetch current model tags
  const { data: currentTags = [] } = useQuery<TagType[]>({
    queryKey: ["/api/models", model.id, "tags"],
  });

  // Update selected tags when current tags change
  useEffect(() => {
    setSelectedTagIds(currentTags.map(tag => tag.id));
  }, [currentTags]);

  // Mutation to update model category
  const updateCategoryMutation = useMutation({
    mutationFn: async (categoryId: number | null) => {
      const response = await fetch(`/api/models/${model.id}/category`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId }),
      });
      if (!response.ok) throw new Error("Failed to update category");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("category_updated"),
        description: t("category_updated_successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/models"] });
      onUpdate?.();
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("category_update_failed"),
        variant: "destructive",
      });
    },
  });

  // Mutation to update model tags
  const updateTagsMutation = useMutation({
    mutationFn: async (tagIds: number[]) => {
      const response = await fetch(`/api/models/${model.id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds }),
      });
      if (!response.ok) throw new Error("Failed to update tags");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("tags_updated"),
        description: t("tags_updated_successfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/models", model.id, "tags"] });
      onUpdate?.();
    },
    onError: () => {
      toast({
        title: t("error"),
        description: t("tags_update_failed"),
        variant: "destructive",
      });
    },
  });

  // Mutation to create new tag
  const createTagMutation = useMutation({
    mutationFn: async (tagData: { nameEn: string; slug: string; categoryId?: number }) => {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagData),
      });
      if (!response.ok) throw new Error("Failed to create tag");
      return response.json();
    },
    onSuccess: (newTag) => {
      toast({
        title: "Tag created",
        description: "New tag has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      // Automatically add the new tag to selected tags
      setSelectedTagIds(prev => [...prev, newTag.id]);
      setNewTagName("");
      setShowAddTag(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new tag.",
        variant: "destructive",
      });
    },
  });

  const handleCategoryChange = (categoryId: string) => {
    const newCategoryId = categoryId === "none" ? null : parseInt(categoryId);
    setSelectedCategoryId(newCategoryId);
    updateCategoryMutation.mutate(newCategoryId);
  };

  const handleTagToggle = (tagId: number) => {
    const newTagIds = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter(id => id !== tagId)
      : [...selectedTagIds, tagId];
    
    setSelectedTagIds(newTagIds);
    updateTagsMutation.mutate(newTagIds);
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    
    const slug = newTagName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .trim();
    
    createTagMutation.mutate({
      nameEn: newTagName.trim(),
      slug,
      categoryId: selectedCategoryId || undefined,
    });
  };

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          Model Categorization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Selection */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={selectedCategoryId?.toString() || "none"}
            onValueChange={handleCategoryChange}
            disabled={updateCategoryMutation.isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No category</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.nameEn}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCategory && (
            <p className="text-sm text-muted-foreground">
              {selectedCategory.descriptionEn}
            </p>
          )}
        </div>

        <Separator />

        {/* Tags Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddTag(!showAddTag)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Tag
            </Button>
          </div>

          {/* Add new tag form */}
          {showAddTag && (
            <div className="flex gap-2">
              <Input
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
              />
              <Button
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTagMutation.isPending}
                size="sm"
              >
                Create
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddTag(false);
                  setNewTagName("");
                }}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Current tags */}
          {currentTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Current tags:</p>
              <div className="flex flex-wrap gap-2">
                {currentTags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                    style={{ backgroundColor: tag.color + "20", color: tag.color }}
                  >
                    {tag.nameEn}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-destructive"
                      onClick={() => handleTagToggle(tag.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Available tags */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Available tags {selectedCategory && `for ${selectedCategory.nameEn}`}:
              </p>
              <div className="flex flex-wrap gap-2">
                {availableTags
                  .filter(tag => !selectedTagIds.includes(tag.id))
                  .map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => handleTagToggle(tag.id)}
                    >
                      {tag.nameEn}
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({tag.usageCount})
                      </span>
                    </Badge>
                  ))}
              </div>
            </div>
          )}

          {availableTags.length === 0 && selectedCategory && (
            <p className="text-sm text-muted-foreground">
              No tags available for this category. Create the first one above!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}