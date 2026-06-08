'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Plus, X, Loader2, Trash2, Tag, ArrowLeft, Edit2, Check } from "lucide-react";
import Link from "next/link";

interface TagData {
  id: string;
  name: string;
  color: string;
  description?: string;
  count: number;
}

const TAG_COLORS = [
  { name: "Blue", value: "bg-blue-100 text-blue-800 border-blue-300" },
  { name: "Green", value: "bg-green-100 text-green-800 border-green-300" },
  { name: "Red", value: "bg-red-100 text-red-800 border-red-300" },
  { name: "Yellow", value: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { name: "Purple", value: "bg-purple-100 text-purple-800 border-purple-300" },
  { name: "Pink", value: "bg-pink-100 text-pink-800 border-pink-300" },
  { name: "Indigo", value: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { name: "Cyan", value: "bg-cyan-100 text-cyan-800 border-cyan-300" },
];

export default function ManageTagsPage() {
  const [tags, setTags] = useState<TagData[]>([
    { id: "1", name: "Hot Lead", color: "bg-red-100 text-red-800 border-red-300", description: "High priority leads", count: 12 },
    { id: "2", name: "Prospect", color: "bg-blue-100 text-blue-800 border-blue-300", description: "Initial prospects", count: 28 },
    { id: "3", name: "Active", color: "bg-green-100 text-green-800 border-green-300", description: "Currently engaged", count: 15 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("bg-blue-100 text-blue-800 border-blue-300");
  const [newTagDescription, setNewTagDescription] = useState("");

  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [editingTagColor, setEditingTagColor] = useState("");
  const [editingTagDescription, setEditingTagDescription] = useState("");

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      setError("Tag name is required");
      return;
    }

    const newTag: TagData = {
      id: Date.now().toString(),
      name: newTagName,
      color: newTagColor,
      description: newTagDescription,
      count: 0,
    };

    setTags([...tags, newTag]);
    setSuccess(`Tag "${newTagName}" created successfully`);
    setNewTagName("");
    setNewTagColor("bg-blue-100 text-blue-800 border-blue-300");
    setNewTagDescription("");
    setIsCreatingTag(false);
    setError("");

    setTimeout(() => setSuccess(""), 3000);
  };

  const handleEditTag = (tag: TagData) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
    setEditingTagColor(tag.color);
    setEditingTagDescription(tag.description || "");
  };

  const handleSaveEdit = () => {
    if (!editingTagName.trim()) {
      setError("Tag name is required");
      return;
    }

    setTags(tags.map(tag =>
      tag.id === editingTagId
        ? {
          ...tag,
          name: editingTagName,
          color: editingTagColor,
          description: editingTagDescription,
        }
        : tag
    ));

    setSuccess("Tag updated successfully");
    setEditingTagId(null);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteTag = (tag: TagData) => {
    if (tag.count > 0) {
      setError(`Cannot delete tag "${tag.name}" - it has ${tag.count} contacts assigned. Remove tag from contacts first.`);
      return;
    }

    setTags(tags.filter(t => t.id !== tag.id));
    setSuccess(`Tag "${tag.name}" deleted`);
    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/contacts">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Tags</h1>
          <p className="text-sm text-gray-500 mt-1">Create, edit, and organize contact tags for better categorization.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3">
          <X className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-xl text-sm border border-green-100 flex items-start gap-3">
          <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create/Edit Tag Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b">
            <CardTitle className="text-base">
              {editingTagId ? "Edit Tag" : "Create New Tag"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Tag Name *</label>
              <input
                type="text"
                value={editingTagId ? editingTagName : newTagName}
                onChange={(e) => editingTagId ? setEditingTagName(e.target.value) : setNewTagName(e.target.value)}
                placeholder="e.g., VIP Client"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => editingTagId ? setEditingTagColor(color.value) : setNewTagColor(color.value)}
                    className={`p-2 rounded-lg border-2 transition-all ${editingTagId ? editingTagColor === color.value ? 'border-gray-900 ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200' : newTagColor === color.value ? 'border-gray-900 ring-2 ring-offset-2 ring-blue-500' : 'border-gray-200'}`}
                    title={color.name}
                  >
                    <div className={`h-6 w-6 rounded ${color.value}`}></div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-2">Description (optional)</label>
              <textarea
                value={editingTagId ? editingTagDescription : newTagDescription}
                onChange={(e) => editingTagId ? setEditingTagDescription(e.target.value) : setNewTagDescription(e.target.value)}
                placeholder="Add notes about this tag..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Preview */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">Preview:</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${editingTagId ? editingTagColor : newTagColor}`}>
                {editingTagId ? editingTagName || "Tag Name" : newTagName || "Tag Name"}
              </span>
            </div>

            <div className="flex gap-2">
              {editingTagId && (
                <Button
                  variant="outline"
                  onClick={() => setEditingTagId(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                onClick={editingTagId ? handleSaveEdit : handleCreateTag}
                className="flex-1"
              >
                {editingTagId ? "Save Changes" : "Create Tag"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tags List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">All Tags ({tags.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tags.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No tags created yet. Create your first tag to get started.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {tags.map((tag) => (
                    <div key={tag.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${tag.color}`}>
                            {tag.name}
                          </span>
                          <span className="inline-block px-2 py-1 rounded bg-gray-100 text-xs text-gray-700 font-medium">
                            {tag.count} contacts
                          </span>
                        </div>
                        {tag.description && (
                          <p className="text-xs text-gray-600">{tag.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTag(tag)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTag(tag)}
                          disabled={tag.count > 0}
                          className={`h-8 w-8 p-0 ${tag.count > 0 ? 'opacity-50 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                          title={tag.count > 0 ? `Cannot delete - ${tag.count} contacts assigned` : "Delete tag"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader className="border-b">
              <CardTitle className="text-base">Bulk Tag Assignment</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Go back to the Contacts page and use the filter panel to select contacts, then assign or remove tags in bulk from the actions menu.
                </p>
              </div>
              <Link href="/contacts">
                <Button variant="outline" className="w-full">
                  Back to Contacts
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
