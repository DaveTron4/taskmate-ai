import { useState, useEffect } from "react";
import { X, Calendar, Clock, Tag, Trash2 } from "lucide-react";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: NewTask) => void;
  onDelete?: (taskId: string) => void;
  editTask?: EditTask | null;
}

interface NewTask {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  category: "school" | "personal" | "work";
  priority: "low" | "medium" | "high";
  hasNoDueDate: boolean;
}

interface EditTask {
  taskId: string;
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  category: "school" | "personal" | "work";
  priority: "low" | "medium" | "high";
  hasNoDueDate: boolean;
}

export default function AddTaskModal({ isOpen, onClose, onSave, onDelete, editTask }: AddTaskModalProps) {
  const [formData, setFormData] = useState<NewTask>({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
    category: "school",
    priority: "medium",
    hasNoDueDate: false,
  });

  // Update form data when editTask changes
  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description,
        dueDate: editTask.dueDate,
        dueTime: editTask.dueTime,
        category: editTask.category,
        priority: editTask.priority,
        hasNoDueDate: editTask.hasNoDueDate,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        category: "school",
        priority: "medium",
        hasNoDueDate: false,
      });
    }
  }, [editTask]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.title.trim()) return;
    onSave({ ...formData, taskId: editTask?.taskId } as any);
    onClose();
    // Reset form
    setFormData({
      title: "",
      description: "",
      dueDate: "",
      dueTime: "",
      category: "school",
      priority: "medium",
      hasNoDueDate: false,
    });
  };

  const handleDelete = () => {
    if (!editTask?.taskId) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
      onDelete?.(editTask.taskId);
      onClose();
    }
  };

  const categoryColors = {
    school: { name: "School", color: "text-purple-600 bg-purple-100" },
    personal: { name: "Personal", color: "text-orange-600 bg-orange-100" },
    work: { name: "Work", color: "text-cyan-600 bg-cyan-100" },
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-1/2 mx-2">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-gray-200">
          <div className="flex items-center gap-1">
            <h2 className="text-base font-semibold text-slate-900">
              {editTask ? "Edit Task" : "Add New Task"}
            </h2>
            {editTask && onDelete && (
              <button
                onClick={handleDelete}
                className="p-1 hover:bg-red-100 rounded transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-2 h-2 text-red-600" />
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-2 h-2 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-2 space-y-2">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Complete CS 101 Assignment"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs text-slate-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              placeholder="Add any additional details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs resize-none bg-gray-50 text-slate-900"
            />
          </div>

          {/* Due Date & Time */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Due Date & Time
            </label>
            <div className="flex items-center gap-1 mb-1">
              <input
                type="checkbox"
                id="noDueDate"
                checked={formData.hasNoDueDate}
                onChange={(e) => setFormData({ ...formData, hasNoDueDate: e.target.checked })}
                className="w-2 h-2 rounded border-gray-300"
              />
              <label htmlFor="noDueDate" className="text-xs text-slate-600">
                No due date
              </label>
            </div>
            <div className="flex gap-1">
              <div className="flex-1 relative">
                <Calendar className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 text-slate-400" />
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  disabled={formData.hasNoDueDate}
                  className="w-full pl-5 pr-1 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs disabled:bg-gray-100 disabled:cursor-not-allowed text-slate-900"
                />
              </div>
              <div className="flex-1 relative">
                <Clock className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 text-slate-400" />
                <input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  disabled={formData.hasNoDueDate}
                  className="w-full pl-5 pr-1 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs disabled:bg-gray-100 disabled:cursor-not-allowed text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-700 mb-1">
              <Tag className="w-2 h-2" />
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as "school" | "personal" | "work" })}
              className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs text-slate-900"
            >
              {Object.entries(categoryColors).map(([key, { name }]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: "high" })}
                className={`py-1 px-2 rounded text-xs font-medium transition-all ${
                  formData.priority === "high"
                    ? "bg-rose-100 text-rose-700 border-2 border-rose-500"
                    : "bg-white text-slate-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                High
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: "medium" })}
                className={`py-1 px-2 rounded text-xs font-medium transition-all ${
                  formData.priority === "medium"
                    ? "bg-amber-100 text-amber-700 border-2 border-amber-500"
                    : "bg-white text-slate-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: "low" })}
                className={`py-1 px-2 rounded text-xs font-medium transition-all ${
                  formData.priority === "low"
                    ? "bg-emerald-100 text-emerald-700 border-2 border-emerald-500"
                    : "bg-white text-slate-600 border border-gray-300 hover:bg-gray-50"
                }`}
              >
                Low
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-1 p-2 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!formData.title.trim()}
            className="px-2 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editTask ? "Update Task" : "Save Task"}
          </button>
        </div>
      </div>
    </div>
  );
}
