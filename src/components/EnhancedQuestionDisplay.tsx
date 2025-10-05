import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Edit3,
  Trash2,
  Split,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Info,
  Settings,
  DollarSign,
  Shield,
  User,
  Zap,
  Link,
  Headphones,
  Rocket,
  Award,
  Users,
  Star,
  Plus,
  Target
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import {
  Badge,
} from '../components/ui/badge';
import {
  Button,
} from '../components/ui/button';
import {
  Input,
} from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Checkbox,
} from '../components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../components/ui/collapsible';
import {
  Textarea,
} from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import {
  ExtractedQuestion,
  QuestionCategory,
  QuestionComplexity,
  QuestionPriority,
  RequirementType,
  SubQuestion
} from '../lib/types/rfp-analyzer';
import { useQuestionExtraction } from '../hooks/useQuestionExtraction';
import { useQuestionCategories } from '../hooks/useQuestionCategories';

interface EnhancedQuestionDisplayProps {
  questions: ExtractedQuestion[];
  onQuestionSelect?: (questionId: string) => void;
  onQuestionEdit?: (questionId: string, updates: Partial<ExtractedQuestion>) => void;
  onQuestionSplit?: (questionId: string, splitPoints: string[]) => void;
  onQuestionDelete?: (questionId: string) => void;
  showFilters?: boolean;
  showBulkActions?: boolean;
  compact?: boolean;
}

const iconMap = {
  Settings: Settings,
  DollarSign: DollarSign,
  Shield: Shield,
  CheckCircle: CheckCircle,
  User: User,
  Zap: Zap,
  Link: Link,
  Headphones: Headphones,
  Rocket: Rocket,
  Award: Award,
  Users: Users,
  Circle: Circle,
  AlertCircle: AlertCircle,
  AlertTriangle: AlertTriangle,
  XCircle: XCircle,
  ArrowUp: ArrowUp,
  ArrowDown: ArrowDown,
  Minus: Minus,
  Info: Info,
  Star: Star,
  Plus: Plus,
  Target: Target
};

export function EnhancedQuestionDisplay({
  questions,
  onQuestionSelect,
  onQuestionEdit,
  onQuestionSplit,
  onQuestionDelete,
  showFilters = true,
  showBulkActions = true,
  compact = false
}: EnhancedQuestionDisplayProps) {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<QuestionComplexity | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<QuestionPriority | 'all'>('all');
  const [showMultiPartOnly, setShowMultiPartOnly] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const {
    categoryConfigs,
    complexityConfigs,
    priorityConfigs,
    requirementTypeConfigs,
    analyzeQuestionDistribution,
    getQuestionTypeStats,
    prioritizeQuestions
  } = useQuestionCategories();

  // Filter questions based on current filters
  const filteredQuestions = useMemo(() => {
    return questions.filter(question => {
      // Search filter
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        const matchesText = question.originalText.toLowerCase().includes(searchLower) ||
                           question.normalizedText.toLowerCase().includes(searchLower) ||
                           question.keywords.some(keyword => keyword.includes(searchLower));
        if (!matchesText) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && question.category !== selectedCategory) {
        return false;
      }

      // Complexity filter
      if (selectedComplexity !== 'all' && question.complexity !== selectedComplexity) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'all' && question.priority !== selectedPriority) {
        return false;
      }

      // Multi-part filter
      if (showMultiPartOnly && !question.isMultiPart) {
        return false;
      }

      return true;
    });
  }, [questions, searchText, selectedCategory, selectedComplexity, selectedPriority, showMultiPartOnly]);

  const stats = getQuestionTypeStats(filteredQuestions);
  const distribution = analyzeQuestionDistribution(filteredQuestions);

  // Toggle question expansion
  const toggleExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Toggle question selection
  const toggleSelection = (questionId: string) => {
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
    onQuestionSelect?.(questionId);
  };

  // Start editing a question
  const startEditing = (question: ExtractedQuestion) => {
    setEditingQuestion(question.id);
    setEditingText(question.normalizedText);
  };

  // Save edited question
  const saveEdit = () => {
    if (editingQuestion && onQuestionEdit) {
      onQuestionEdit(editingQuestion, { normalizedText: editingText });
      setEditingQuestion(null);
      setEditingText('');
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingQuestion(null);
    setEditingText('');
  };

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Circle;
    return IconComponent;
  };

  // Render category badge
  const renderCategoryBadge = (category: QuestionCategory) => {
    const config = categoryConfigs[category];
    const IconComponent = getIconComponent(config.icon);

    return (
      <Badge variant="secondary" className={`${config.bgColor} ${config.color} ${config.borderColor} border`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  // Render complexity indicator
  const renderComplexityIndicator = (complexity: QuestionComplexity) => {
    const config = complexityConfigs[complexity];
    const IconComponent = getIconComponent(config.icon);

    return (
      <div className={`flex items-center px-2 py-1 rounded text-xs ${config.bgColor} ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </div>
    );
  };

  // Render priority indicator
  const renderPriorityIndicator = (priority: QuestionPriority) => {
    const config = priorityConfigs[priority];
    const IconComponent = getIconComponent(config.icon);

    return (
      <div className={`flex items-center px-2 py-1 rounded-full text-xs border ${config.bgColor} ${config.color} ${config.borderColor}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </div>
    );
  };

  // Render requirement type indicator
  const renderRequirementTypeIndicator = (type: RequirementType) => {
    const config = requirementTypeConfigs[type];
    const IconComponent = getIconComponent(config.icon);

    return (
      <div className={`flex items-center px-2 py-1 rounded text-xs ${config.bgColor} ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </div>
    );
  };

  // Render sub-questions
  const renderSubQuestions = (subQuestions: SubQuestion[]) => {
    if (subQuestions.length === 0) return null;

    return (
      <div className="mt-3 pl-4 border-l-2 border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Sub-questions:</h4>
        <div className="space-y-2">
          {subQuestions.map((subQuestion) => (
            <div key={subQuestion.id} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm text-gray-800">{subQuestion.text}</p>
                <div className="flex space-x-1 ml-2">
                  {renderCategoryBadge(subQuestion.category)}
                  {renderPriorityIndicator(subQuestion.priority)}
                </div>
              </div>
              {renderRequirementTypeIndicator(subQuestion.requirementType)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Stats */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Questions Overview</span>
              <div className="text-sm text-gray-600">
                {filteredQuestions.length} of {questions.length} questions
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search questions..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as QuestionCategory | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryConfigs).map(([category, config]) => (
                    <SelectItem key={category} value={category}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedComplexity} onValueChange={(value) => setSelectedComplexity(value as QuestionComplexity | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Complexities</SelectItem>
                  {Object.entries(complexityConfigs).map(([complexity, config]) => (
                    <SelectItem key={complexity} value={complexity}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={(value) => setSelectedPriority(value as QuestionPriority | 'all')}>
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Object.entries(priorityConfigs).map(([priority, config]) => (
                    <SelectItem key={priority} value={priority}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional filters */}
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <Checkbox
                  checked={showMultiPartOnly}
                  onCheckedChange={setShowMultiPartOnly}
                />
                <span className="text-sm">Show multi-part questions only</span>
              </label>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.criticalQuestions}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.complexQuestions}</div>
                <div className="text-sm text-gray-600">Complex</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.round(stats.averageConfidence * 100)}%</div>
                <div className="text-sm text-gray-600">Avg. Confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk actions */}
      {showBulkActions && selectedQuestions.size > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Bulk Edit
                </Button>
                <Button variant="outline" size="sm">
                  Export Selected
                </Button>
                <Button variant="destructive" size="sm">
                  Delete Selected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions list */}
      <div className="space-y-4">
        {prioritizeQuestions(filteredQuestions).map((question) => (
          <Card key={question.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="space-y-3">
                {/* Question header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {showBulkActions && (
                      <Checkbox
                        checked={selectedQuestions.has(question.id)}
                        onCheckedChange={() => toggleSelection(question.id)}
                        className="mt-1"
                      />
                    )}

                    <div className="flex-1 space-y-2">
                      {/* Question text */}
                      {editingQuestion === question.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex space-x-2">
                            <Button size="sm" onClick={saveEdit}>Save</Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-900">
                            {question.normalizedText}
                          </p>
                          {question.originalText !== question.normalizedText && (
                            <p className="text-xs text-gray-500 italic">
                              Original: {question.originalText}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Badges and indicators */}
                      <div className="flex flex-wrap gap-2">
                        {renderCategoryBadge(question.category)}
                        {renderComplexityIndicator(question.complexity)}
                        {renderPriorityIndicator(question.priority)}
                        {renderRequirementTypeIndicator(question.requirementType)}

                        {question.isMultiPart && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Multi-part ({question.subQuestions.length})
                          </Badge>
                        )}

                        <Badge variant="outline" className="text-xs">
                          {Math.round(question.confidenceScore * 100)}% confidence
                        </Badge>
                      </div>

                      {/* Keywords */}
                      {question.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {question.keywords.slice(0, 5).map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs bg-gray-100">
                              {keyword}
                            </Badge>
                          ))}
                          {question.keywords.length > 5 && (
                            <Badge variant="secondary" className="text-xs bg-gray-100">
                              +{question.keywords.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center space-x-1 ml-4">
                    {question.isMultiPart && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpansion(question.id)}
                      >
                        {expandedQuestions.has(question.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(question)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>

                    {onQuestionSplit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuestionSplit(question.id, [question.originalText])}
                      >
                        <Split className="h-4 w-4" />
                      </Button>
                    )}

                    {onQuestionDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onQuestionDelete(question.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Expandable sub-questions */}
                {question.isMultiPart && expandedQuestions.has(question.id) && (
                  <Collapsible open={true}>
                    <CollapsibleContent>
                      {renderSubQuestions(question.subQuestions)}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Context clues */}
                {question.contextClues.length > 0 && !compact && (
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      <strong>Context:</strong> {question.contextClues.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredQuestions.length === 0 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No questions found</h3>
                <p className="text-sm">Try adjusting your filters or search criteria.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default EnhancedQuestionDisplay;